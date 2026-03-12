import { HttpStatus, Injectable } from '@nestjs/common';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { NetService } from 'src/net/net.service';

import { PlayerService } from 'src/player/player.service';
import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { Team } from '../team.schema';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { CreateTeamInput, UpdateTeamInput } from './team.input';
import { CreateOrUpdateTeamResponse } from './team.response';
import { UserService } from 'src/user/user.service';
import { UserRole } from 'src/user/user.schema';
import { GroupService } from 'src/group/group.service';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
const GraphQLUpload = GraphQLUploadModule.default;

@Injectable()
export class TeamMutations {
  constructor(
    private eventService: EventService,
    private teamService: TeamService,
    private cloudinaryService: CloudinaryService,
    private userService: UserService,
    private matchService: TeamService,
    private groupService: GroupService,
    private netService: NetService,
    private playerService: PlayerService,
    private playerRankingService: PlayerRankingService,
  ) { }



  async singleDelete(teamExist: Team) {
    const teamPlayerIds = teamExist.players.map((p) => p.toString());
    const teamNetIds = teamExist.nets.map((n) => n.toString());
    const teamMatchIds = teamExist.matches.map((m) => m.toString());

    const updatePromises = [];
    updatePromises.push(this.playerRankingService.deleteOne({ team: teamExist._id }));

    updatePromises.push(
      this.playerService.updateMany({ _id: { $in: teamPlayerIds } }, { $pull: { team: teamPlayerIds } }),
    );
    updatePromises.push(this.netService.deleteMany({ _id: { $in: teamNetIds } }));
    if (teamExist.captain)
      updatePromises.push(this.playerService.updateOne({ _d: teamExist.captain }, { $pull: { teams: teamExist._id } }));
    if (teamExist.cocaptain)
      updatePromises.push(
        this.playerService.updateOne({ _d: teamExist.cocaptain }, { $pull: { teams: teamExist._id } }),
      );
    if (teamMatchIds.length > 0)
      updatePromises.push(
        this.matchService.updateMany({ _id: { $in: teamMatchIds } }, { $set: { teamA: null, teamB: null } }),
      );
    updatePromises.push(this.teamService.delete({ _id: teamExist._id }));
    await Promise.all(updatePromises);
  }

  async createTeam(
    input: CreateTeamInput,
    logo?: Promise<FileUpload>,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const players = input.players ? input.players : [];

      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);

      const teamExist = await this.teamService.findOne({ name: input.name, event: input.event });
      if (teamExist) {
        return AppResponse.handleError({
          code: 404,
          success: false,
          message: 'There is already a team exist with this name in this event!',
        });
      }

      const teamObj: Team = {
        name: input.name,
        logo: logoUrl,
        sendCredentials: false,
        captain: input.captain,
        event: input.event,
        division: input.division.trim().toLowerCase(),
        rankLock: false,
        active: true,
        players,
        nets: [],
        playerRankings: [],
      };
      if (input.group) {
        teamObj.group = input.group;
      }
      const [newTeam, findEvent] = await Promise.all([
        this.teamService.create(teamObj),
        this.eventService.findById(input.event.toString()),
      ]);

      // ===== Captain - User - Player - Team Relationship update =====
      const promiseOperations = [];
      promiseOperations.push(this.eventService.updateOne({ _id: input.event }, { $push: { teams: newTeam._id } }));

      // Create player ranking when creating match
      const playerRankings = [];
      for (let i = 0; i < players.length; i += 1) {
        promiseOperations.push(this.playerService.updateOne({ _id: players[i] }, { $push: { teams: newTeam._id } }));
        // Create player ranking when creating team
        playerRankings.push({ rank: i + 1, player: players[i] });
      }
      const teamPlayerRanking = await this.playerRankingService.create({
        rankings: playerRankings,
        rankLock: false,
        team: newTeam._id,
      });
      promiseOperations.push(
        this.teamService.updateOne({ _id: newTeam._id }, { $addToSet: { playerRankings: teamPlayerRanking._id } }),
      );

      if (input.captain) {
        // =====  Create new user for captain =====
        const findPlayer = await this.playerService.findById(input.captain.toString());
        // const username = findPlayer.firstName.toLowerCase() + newTeam.num.toString();
        const username = findPlayer?.username ?? this.playerService.playerUsername(findPlayer.username);
        promiseOperations.push(this.playerService.updateOne({ _id: input.captain.toString() }, { $set: { username } }));
        const rawPassword = findEvent.coachPassword;
        const captainUser = await this.userService.create({
          firstName: findPlayer.firstName,
          lastName: findPlayer.lastName,
          role: UserRole.captain,
          active: true,
          captainplayer: input.captain,
          email: username,
          password: rawPassword,
        });
        promiseOperations.push(
          this.playerService.updateOne(
            { _id: input.captain },
            {
              $addToSet: { captainofteams: newTeam._id }, // Add push
              captainuser: captainUser._id,
            },
          ),
        );
      }

      if (input.group) {
        promiseOperations.push(
          this.groupService.updateOne({ _id: input.group }, { $addToSet: { teams: newTeam._id } }),
        );
      }

      const [createdTeam, ...promises] = await Promise.all([this.teamService.findOne({ _id: newTeam._id }),
      ...promiseOperations]);


      // Convert Team to CustomTeam format
      const customTeam = {
        ...createdTeam,
        matches: (newTeam.matches || []).map((m: any) => m?.toString?.() || String(m)),
        nets: (newTeam.nets || []).map((n: any) => n?.toString?.() || String(n)),
        players: (newTeam.players || []).map((p: any) => p?.toString?.() || String(p)),
        captain: newTeam.captain ? String(newTeam.captain) : undefined,
        cocaptain: newTeam.cocaptain ? String(newTeam.cocaptain) : undefined,
        group: newTeam.group ? String(newTeam.group) : undefined,
      };

      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'A team has been created successfully',
        data: customTeam,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async updateTeam(
    input: UpdateTeamInput,
    teamId: string,
    eventId: string,
    logo?: Promise<FileUpload>,
  ): Promise<CreateOrUpdateTeamResponse> {
    try {
      const [teamExist, eventExist] = await Promise.all([
        this.teamService.findById(teamId),
        this.eventService.findById(eventId),
      ]);
      if (!teamExist) return AppResponse.notFound('Team');
      if (!eventExist) return AppResponse.notFound('Event');

      const updatePromises = [];
      const teamObj: any = { ...input };

      // ===== Update division =====
      if (teamObj.division) {
        const newDivision = teamObj.division.toString().trim().toLowerCase();
        teamObj.division = newDivision;
        updatePromises.push(
          this.playerService.updateMany({ teams: { $in: [teamExist._id] } }, { $set: { division: newDivision } }),
        );
      }

      // ===== Update group =====
      if (teamObj.group && String(teamObj?.group) !== String(teamExist?.group)) {
        updatePromises.push(
          this.groupService.updateOne({ _id: teamExist._id }, { $pull: { teams: teamExist._id } }),
        );
        updatePromises.push(
          this.groupService.updateOne({ _id: teamObj.group }, { $addToSet: { teams: teamExist._id } }),
        );
      }

      // ===== Update captain =====
      if (input.captain) {
        const playerExist = await this.playerService.findById(input.captain.toString());

        if (playerExist) {
          // const newUsername = playerExist.firstName.trim().toLowerCase() + teamExist.num.toString();
          const newUsername = playerExist?.username ?? this.playerService.playerUsername(playerExist.firstName);
          const playerUserExist = await this.userService.findOne({ email: playerExist.username });
          const createOrUpdatePlayer = await this.userService.createCapUser(
            playerExist,
            playerUserExist,
            eventExist,
            newUsername,
            UserRole.captain,
          );
          const newCaptainUserId = createOrUpdatePlayer._id;

          if (teamExist.captain) {
            // =====  Make prevCaptain null =====
            const prevCaptain = await this.playerService.findById(teamExist.captain.toString());
            if (input.captain !== teamExist.captain.toString()) {
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: teamExist.captain.toString() },
                  { $pull: { captainofteams: teamExist._id.toString() }, captainuser: null, newUsername: null },
                ),
              );
              updatePromises.push(this.userService.deleteOne({ _id: prevCaptain?.captainuser?.toString() }));
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: input.captain.toString() },
                  { $push: { captainofteams: teamId }, captainuser: newCaptainUserId, username: newUsername },
                ),
              );
            }
          } else {
            updatePromises.push(
              this.playerService.updateOne(
                { _id: input.captain.toString() },
                { $push: { captainofteams: teamId }, captainuser: newCaptainUserId, username: newUsername },
              ),
            );
          }
          teamObj.captain = playerExist._id;
        }
      }

      // ===== Update co-captain
      if (input.cocaptain) {
        const playerExist = await this.playerService.findById(input.cocaptain.toString());
        if (playerExist) {
          const playerUserExist = await this.userService.findOne({ email: playerExist.username });
          // const newUsername = playerExist.firstName.toLowerCase() + teamExist.num.toString();
          const newUsername = playerExist?.username ?? this.playerService.playerUsername(playerExist.firstName);
          const createOrUpdatePlayer = await this.userService.createCapUser(
            playerExist,
            playerUserExist,
            eventExist,
            newUsername,
            UserRole.co_captain,
          );
          const newCaptainUserId = createOrUpdatePlayer._id;

          if (teamExist.cocaptain) {
            // ===== make prev co captain null =====
            const prevCaptain = await this.playerService.findById(teamExist.cocaptain.toString());
            if (input.cocaptain !== teamExist.cocaptain.toString()) {
              // Update previous player
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: teamExist.cocaptain.toString() },
                  { $pull: { cocaptainofteams: teamExist._id.toString() }, cocaptainuser: null, username: null },
                ),
              );
              // Delete previous user
              updatePromises.push(this.userService.deleteOne({ _id: prevCaptain?.cocaptainuser?.toString() }));
              // Update new player
              updatePromises.push(
                this.playerService.updateOne(
                  { _id: input.cocaptain.toString() },
                  { $push: { cocaptainofteams: teamId }, cocaptainuser: newCaptainUserId, username: newUsername },
                ),
              );
            }
          } else {
            updatePromises.push(
              this.playerService.updateOne(
                { _id: input.cocaptain.toString() },
                { $push: { cocaptainofteams: teamId }, cocaptainuser: newCaptainUserId, username: newUsername },
              ),
            );
          }
          teamObj.cocaptain = playerExist._id;
        }
      }

      // =====  Update Logo =====
      let logoUrl: string | null = null;
      if (logo) logoUrl = await this.cloudinaryService.uploadFiles(logo);
      if (logoUrl) teamObj.logo = logoUrl;

      if (input.event && input.event !== teamExist.event.toString()) {
        updatePromises.push(this.eventService.updateOne({ _id: eventId }, { $pull: { teams: teamId } })); // Previous event
        updatePromises.push(this.eventService.updateOne({ _id: input.event }, { $addToSet: { teams: teamId } })); // New event
      }

      // =====  Update players =====
      const players = input.players ? input.players : [];
      const prevPlayerIds = teamExist.players.map((pId) => pId.toString());
      for (let i = 0; i < players.length; i += 1) {
        updatePromises.push(this.playerService.updateOne({ _id: players[i] }, { $addToSet: { teams: teamExist._id } }));
      }
      teamObj.players = [...new Set([...prevPlayerIds, ...players])];
      updatePromises.push(this.teamService.updateOne({ _id: teamId }, teamObj));

      // ===== Update Player Ranking (Make sure all players have ranking) =====
      const playerRankings = await this.playerRankingService.find({ team: teamId, rankLock: false });
      if (playerRankings && playerRankings.length > 0 && players && players.length > 0) {
        for (const pr of playerRankings) {
          const rankings = await this.playerRankingService.findItems({ playerRanking: pr._id });
          const highestRank = rankings.length === 0 ? 0 : Math.max(...rankings.map((p) => p.rank));

          const itemsToInsert = [];
          let rankIncrement = 0;
          for (let i = 0; i < teamObj.players.length; i += 1) {
            const findRank = rankings.find((r) => r.player.toString() === teamObj.players[i]);
            if (!findRank) {
              itemsToInsert.push({
                player: teamObj.players[i],
                rank: highestRank + rankIncrement + 1,
                playerRanking: pr._id,
              });
              rankIncrement += 1;
            }
          }
          if (itemsToInsert && itemsToInsert.length > 0) {
            const rankings = await this.playerRankingService.insertManyItems(itemsToInsert);
            await this.playerRankingService.updateOne(
              { _id: pr._id },
              { $addToSet: { rankings: { $each: rankings.map((ri) => ri._id.toString()) } } },
            );
          }
        }
      }

      await Promise.all(updatePromises);
      const updatedTeam = await this.teamService.findById(teamId);
      if (!updatedTeam) {
        return AppResponse.notFound('Team');
      }

      // Convert Team to CustomTeam format
      const customTeam = {
        ...updatedTeam,
        matches: (updatedTeam.matches || []).map((m: any) => m?.toString?.() || String(m)),
        nets: (updatedTeam.nets || []).map((n: any) => n?.toString?.() || String(n)),
        players: (updatedTeam.players || []).map((p: any) => p?.toString?.() || String(p)),
        captain: updatedTeam.captain ? String(updatedTeam.captain) : undefined,
        cocaptain: updatedTeam.cocaptain ? String(updatedTeam.cocaptain) : undefined,
        group: updatedTeam.group ? String(updatedTeam.group) : undefined,
      };

      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A team has been updated successfully',
        data: customTeam,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async deleteTeam(teamId: string): Promise<CreateOrUpdateTeamResponse> {
    try {
      const teamExist = await this.teamService.findById(teamId);
      if (!teamExist) return AppResponse.notFound('Team');
      await this.singleDelete(teamExist);
      return {
        code: HttpStatus.NO_CONTENT,
        success: true,
        message: 'A team has been deleted successfully',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async deleteTeams(teamIds: string[]): Promise<CreateOrUpdateTeamResponse> {
    try {
      const deletePromises = [];
      for (let i = 0; i < teamIds.length; i++) {
        try {
          const teamExist = await this.teamService.findById(teamIds[i]);
          if (!teamExist) {
            continue;
          }
          if (teamExist.captain) {
            deletePromises.push(
              this.playerService.updateOne(
                { _id: teamExist.captain.toString() },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }

          if (teamExist.cocaptain) {
            deletePromises.push(
              this.playerService.updateOne(
                { _id: teamExist.cocaptain.toString() },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }
          if (teamExist.matches && teamExist.matches.length > 0) {
            // this.matchService.updateMany({ _id: { $in: teamExist.matches } }, { $set: { teamA: null } });
          }

          if (teamExist.event) {
            deletePromises.push(
              this.eventService.updateOne({ _id: teamExist.event.toString() }, { $pull: { teams: teamExist._id } }),
            );
          }

          if (teamExist.players && teamExist.players.length > 0) {
            deletePromises.push(
              this.playerService.updateMany(
                { _id: { $in: teamExist.players.map(p => String(p)) } },
                { $pull: { teams: teamExist._id.toString() } },
              ),
            );
          }

          if (teamExist.nets && teamExist.nets.length > 0) {
            // deletePromises.push(this.netService.update);
          }

          if (teamExist.group) {
            deletePromises.push(
              this.groupService.updateOne({ _id: teamExist.group }, { $pull: { teams: teamExist._id.toString() } }),
            );
          }

          if (teamExist.playerRankings && teamExist.playerRankings.length > 0) {
            const playerRankings = await this.playerRankingService.find({ _id: { $in: teamExist.playerRankings.map(p => String(p)) } });
            for (const pr of playerRankings) {
              deletePromises.push(this.playerRankingService.deleteManyItem({ _id: { $in: pr.rankings.map(p => String(p)) } }));
            }
            deletePromises.push(this.playerRankingService.deleteMany({ _id: { $in: teamExist.playerRankings.map(p => String(p)) } }));
          }
          if (teamExist) {
            deletePromises.push(this.singleDelete(teamExist));
          }
        } catch (dltErr) {
          console.log(dltErr);
        }
      }

      await Promise.all(deletePromises);

      return {
        code: HttpStatus.NO_CONTENT,
        data: null,
        success: true,
        message: 'Teams have been deleted successfully',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

}
