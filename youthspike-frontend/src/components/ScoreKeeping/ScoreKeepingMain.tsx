"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { IAccessCode, IMatchExpRel, UserRole } from "@/types";
import AccessCodeForm from "@/components/ScoreKeeping/AccessCodeForm";
import ServerReceiver from "@/components/ScoreKeeping/ServerReceiver";
import Link from "next/link";
import { QueryRef, useReadQuery } from "@apollo/client/react";
import { useUser } from "@/lib/UserProvider";
import LocalStorageService from "@/utils/LocalStorageService";
import { useRouter } from "next/navigation";
import { containerVariants, itemVariants } from "@/utils/animation";

interface IScoreKeepingMainProps {
  queryRef: QueryRef<{ getMatch: { data: IMatchExpRel } }>;
  accessCodeList: IAccessCode[];
  accessCode: IAccessCode | null;
}

function ScoreKeepingMain({
  queryRef,
  accessCode,
  accessCodeList,
}: IScoreKeepingMainProps) {
  const { data, error } = useReadQuery(queryRef);
  const user = useUser();
  const router = useRouter();
  const { token, info } = user;
  const matchData = data?.getMatch?.data;

  const redirectFullScoreboard = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const prevMatch = LocalStorageService.getMatch(matchData._id);
    if (prevMatch) {
      LocalStorageService.setMatch(matchData._id, prevMatch.roundId);
    }
    router.push(`/matches/${matchData?._id}/scoreboard`);
  };



  const renderHeadings = () => {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-extrabold text-yellow-400 text-center uppercase tracking-wide mb-6"
        >
          Scorekeeper Settings
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="text-center mb-6 flex flex-wrap justify-center items-center gap-2"
        >
          {info &&
            (info.role === UserRole.admin ||
              info.role === UserRole.director ||
              info.role === UserRole.captain ||
              info.role === UserRole.co_captain) && (
              <Link
                href={`/matches/${matchData._id}`}
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                ← Go back to captain
              </Link>
            )}
          <button
            onClick={redirectFullScoreboard}
            className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
          >
            ← Go to full scoreboard
          </button>
        </motion.div>
      </motion.div>
    );
  };

  if (!accessCode && !token) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full min-h-screen flex items-center justify-center py-12 px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-gray-950/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md border border-gray-800"
        >
          {renderHeadings()}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="access-code"
          >
            <AccessCodeForm
              matchId={matchData._id}
              accessCodes={accessCodeList}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="scorekeeping-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderHeadings()}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="server-receiver-wrapper"
        >
          {matchData && (
            <ServerReceiver
              matchId={matchData._id}
              matchData={matchData}
              accessCode={accessCode}
              token={token || null}
              userInfo={info}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ScoreKeepingMain;
