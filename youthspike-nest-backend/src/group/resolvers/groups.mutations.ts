import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeamService } from 'src/team/team.service';
import { GroupService } from '../group.service';

import { CustomGroupPoints, GetGroupPointsResponse, GetGroupResponse } from './groups.response';
import { AppResponse } from 'src/shared/response';
import { getId } from 'src/utils/helper';
import { CreateGroupInput, CreateGroupPointsInput, UpdateGroupInput, UpdateGroupPointsInput } from './groups.input';
import { MatchService } from 'src/match/match.service';
import { EventService } from 'src/event/event.service';



@Injectable()
export class GroupMutations {
    constructor(
        private readonly configService: ConfigService,
        private readonly groupService: GroupService,
        private readonly eventService: EventService,
        private readonly teamService: TeamService,
        private readonly matchService: MatchService
    ) { }



    // Helpers
    /**
    * Helper to synchronize team and group relationships efficiently.
    * Preserves the required sequence of operations (pull before push) to avoid 
    * MongoDB race conditions, while parallelizing operations across different 
    * collections to improve time and space complexity.
    */
    private async syncTeamGroupRelations(eventId: string, groupId: string, newTeamIds: string[]): Promise<void> {
        const groups = await this.groupService.find({ event: eventId });
        const groupSet = new Set([groupId]);
        if (groups.length) {
            for (const group of groups) {
                if (group) {
                    groupSet.add(String(group._id));
                }
            }
        }
        // 1. Break existing relationships (Parallelized across different collections)
        // Removes groupId from any of the newTeams' groups array
        // Removes any of the newTeams from the group's teams array
        await Promise.all([
            // Remove all groups of the event
            this.teamService.updateMany(
                { _id: { $in: newTeamIds } },
                { $pull: { groups: { $in: [...groupSet] } } }
            ),
            // Remove all teams of the event
            this.groupService.updateMany(
                { _id: { $in: [...groupSet] } },
                { $pull: { teams: { $in: newTeamIds } } }
            ),
        ]);

        // 2. Build new relationships (Parallelized across different collections)
        // Adds groupId to the newTeams' groups array
        // Adds newTeams to the group's teams array
        await Promise.all([
            this.teamService.updateMany(
                { _id: { $in: newTeamIds } },
                { $addToSet: { groups: groupId } }
            ),
            this.groupService.updateOne(
                { _id: groupId },
                { $addToSet: { teams: newTeamIds } }
            ),
        ]);
    }


    /**
    * Helper to remove team and group relationships efficiently.
    * Pulls the specified teams from all groups in the event and 
    * removes the event's groups from the specified teams.
    */
    private async removeTeamGroupRelations(eventId: string, groupId: string, removeTeamIds: string[]): Promise<void> {
        const groups = await this.groupService.find({ event: eventId });
        const groupSet = new Set<string>([groupId]);

        if (groups.length) {
            for (const group of groups) {
                if (group) {
                    groupSet.add(String(group._id));
                }
            }
        }

        await Promise.all([
            // Remove teams from all groups of the event
            this.groupService.updateMany(
                { _id: { $in: [...groupSet] } },
                { $pull: { teams: { $in: removeTeamIds } } }
            ),
            // Remove all groups of the event from the teams being removed
            this.teamService.updateMany(
                { _id: { $in: removeTeamIds } },
                { $pull: { groups: { $in: [...groupSet] } } }
            ),
        ]);
    }




    async createGroup(input: CreateGroupInput): Promise<GetGroupResponse> {
        try {
            /**
             * TODO:
             *  Step-1: Get user id from token if not logged in as admin
             */

            const groupExist = await this.groupService.findOne({
                name: {
                    $regex: `^${input.name}$`,
                    $options: 'i',
                },
                event: input.event,
            });
            if (groupExist) {
                return AppResponse.handleError({
                    code: 406,
                    success: false,
                    message: 'There is already a group exist with this name in this event!',
                });
            }

            const groupObj = { ...input, matches: [] };
            if (input.matches) groupObj.matches;
            const newGroup = await this.groupService.create(groupObj);
            // Update teams and event
            await Promise.all([
                this.eventService.updateOne({ _id: getId(newGroup.event) }, { $addToSet: { groups: newGroup._id } }),
                this.teamService.updateMany({ _id: { $in: input.teams } }, { $addToSet: { groups: newGroup._id } }),
            ]);

            return {
                data: newGroup,
                success: true,
                message: 'Group has been created successfully.',
                code: HttpStatus.CREATED,
            };
        } catch (err) {
            return AppResponse.handleError(err);
        }
    }


    async updateGroup(
        updateInput: UpdateGroupInput,
        eventId?: string,
    ): Promise<GetGroupResponse> {
        try {
            const { _id: groupId, teams: newTeamIds, removeteams, ...restUpdateData } = updateInput;

            // ✅ Step 1: Validate Group
            const existingGroup = await this.groupService.findOne({ _id: groupId });
            if (!existingGroup) return AppResponse.notFound("Group");

            if (updateInput.name) {
                const groupNameExist = await this.groupService.findOne({
                    name: {
                        $regex: `^${updateInput.name}$`,
                        $options: 'i',
                    },
                    event: eventId,
                });
                if (groupNameExist) {
                    return AppResponse.handleError({
                        code: 406,
                        success: false,
                        message: 'There is already a group exist with this name in this event!',
                    });
                }
            }

            // ✅ Step 2: Validate Event (use eventId if provided)
            const targetEventId = eventId || existingGroup.event;

            const event = await this.eventService.findOne({ _id: getId(targetEventId) });
            if (!event) return AppResponse.notFound("Event");

            // ✅ Step 3: Prepare groupIds to remove (other groups in same event)
            // const otherGroupIds = event.groups
            //     .filter((g) => String(g) !== String(groupId)) as string[];

            const updateOperations: Promise<any>[] = [];

            // ✅ Step 4: Handle Teams in BULK (no loop queries)
            if (newTeamIds?.length) {
                await this.syncTeamGroupRelations(eventId, groupId, newTeamIds);
            }

            if (removeteams?.length) {
                await this.removeTeamGroupRelations(eventId, groupId, removeteams);
            }

            // ✅ Step 5: Update group fields
            if (Object.entries(restUpdateData).length > 0) {
                updateOperations.push(
                    this.groupService.updateOne(
                        { _id: groupId },
                        { $set: restUpdateData }
                    )
                );
            }

            // ✅ Execute all in parallel
            await Promise.all(updateOperations);

            const updatedGroup = await this.groupService.findOne({ _id: groupId });

            return {
                data: updatedGroup,
                success: true,
                message: 'Group has been updated successfully.',
                code: HttpStatus.ACCEPTED,
            };

        } catch (err) {
            return AppResponse.handleError(err);
        }
    }

    async deleteGroup(
        context: any,
        groupId: string,
    ): Promise<GetGroupResponse> {
        try {
            const groupExist = await this.groupService.findById(groupId);
            if (!groupExist) {
                return AppResponse.notFound('Group');
            }
            // Teams, matches, event
            const deletePromises = [];
            if (groupExist.teams.length > 0) {
                deletePromises.push(
                    this.teamService.updateMany(
                        { _id: { $in: groupExist.teams.map(g => String(g)) } },
                        { $pull: { groups: groupId } }),
                );
            }

            if (groupExist.matches.length > 0) {
                deletePromises.push(
                    this.matchService.updateMany({ _id: { $in: groupExist.matches.map(m => String(m)) } }, { $pull: { group: groupId } }),
                );
            }

            deletePromises.push(this.eventService.updateOne({ _id: getId(groupExist.event) }, { $pull: { group: groupId } }));
            deletePromises.push(this.groupService.deleteOne({ _id: groupId }));

            await Promise.all(deletePromises);
            return {
                success: true,
                message: 'Group has been deleted successfully.',
                code: HttpStatus.NO_CONTENT,
            };
        } catch (err) {
            return AppResponse.handleError(err);
        }
    }


    async createGroupPoints(
        input: CreateGroupPointsInput,
    ): Promise<GetGroupPointsResponse> {
        try {
            // Validate team
            const team = await this.teamService.findById(input.team);
            if (!team) return AppResponse.notFound('Team');

            // Validate event if provided
            if (input.event) {
                const event = await this.eventService.findOne({ _id: input.event });
                if (!event) return AppResponse.notFound('Event');
            }

            // Prevent duplicate (team + event) entry
            const existing = await this.groupService.pointsFindOne({
                team: input.team,
                ...(input.event ? { event: input.event } : {}),
            });
            if (existing) {
                return AppResponse.handleError({
                    code: HttpStatus.CONFLICT,
                    success: false,
                    message:
                        'Group points already exist for this team in this event. Use update instead.',
                });
            }

            const created = await this.groupService.pointsCreate(input as any);

            return {
                data: created as CustomGroupPoints,
                success: true,
                message: 'Group points have been created successfully.',
                code: HttpStatus.CREATED,
            };
        } catch (err) {
            return AppResponse.handleError(err);
        }
    }

    async updateGroupPoints(
        updateInput: UpdateGroupPointsInput,
    ): Promise<GetGroupPointsResponse> {
        try {
            const { _id, team, event, ...rest } = updateInput;

            const existing = await this.groupService.pointsFindById(_id);
            if (!existing) return AppResponse.notFound('GroupPoints');

            // Validate team if being changed
            if (team) {
                const teamExists = await this.teamService.findById(team);
                if (!teamExists) return AppResponse.notFound('Team');

                // Duplicate check when team/event combination changes
                const targetEvent = event ?? getId(existing.event);
                const duplicate = await this.groupService.pointsFindOne({
                    _id: { $ne: _id },
                    team,
                    ...(targetEvent ? { event: targetEvent } : {}),
                });
                if (duplicate) {
                    return AppResponse.handleError({
                        code: HttpStatus.CONFLICT,
                        success: false,
                        message:
                            'Group points already exist for this team in this event.',
                    });
                }
            }

            if (event) {
                const eventExists = await this.eventService.findOne({ _id: event });
                if (!eventExists) return AppResponse.notFound('Event');
            }

            const updateData: Record<string, any> = { ...rest };
            if (team) updateData.team = team;
            if (event) updateData.event = event;

            if (Object.keys(updateData).length > 0) {
                await this.groupService.pointsUpdateOne(
                    { _id },
                    { $set: updateData },
                );
            }

            const updated = await this.groupService.pointsFindById(_id);

            return {
                data: updated as CustomGroupPoints,
                success: true,
                message: 'Group points have been updated successfully.',
                code: HttpStatus.ACCEPTED,
            };
        } catch (err) {
            return AppResponse.handleError(err);
        }
    }

    async deleteGroupPoints(
        groupPointsId: string,
    ): Promise<GetGroupPointsResponse> {
        try {
            const existing = await this.groupService.pointsFindOne(groupPointsId);
            if (!existing) return AppResponse.notFound('GroupPoints');

            // GroupPoints has no arrays pointing to other collections,
            // so only the document itself needs to be removed.
            await this.groupService.pointsDeleteOne({ _id: groupPointsId });

            return {
                success: true,
                message: 'Group points have been deleted successfully.',
                code: HttpStatus.NO_CONTENT,
            };
        } catch (err) {
            return AppResponse.handleError(err);
        }
    }

}
