
// ------------------------------
// 📦 Common Helper

import { ADD_TEAM_RAW, UPDATE_TEAM_RAW } from "@/graphql/teams";
import { getCookie } from "../clientCookie";
import { BACKEND_URL } from "../keys";

// ------------------------------
async function uploadTeamData(
    isUpdate: boolean,
    teamObj: Record<string, any>,
    uploadedLogo: React.RefObject<null | Blob | MediaSource>,
  ) {
    if (uploadedLogo.current instanceof Blob) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: isUpdate ? UPDATE_TEAM_RAW : ADD_TEAM_RAW,
          variables: teamObj,
        }),
      );
      formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
      formData.set('0', uploadedLogo.current);
  
      const token = getCookie('token');
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const jsonRes = await res.json();
      return jsonRes?.updateTeam || jsonRes?.createTeam || null;
    }
  
    return null;
  }

  export default uploadTeamData;