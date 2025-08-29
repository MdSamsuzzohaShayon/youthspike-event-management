import { UPDATE_DIRECTOR_RAW } from "@/graphql/director";
import { BACKEND_URL } from "../keys";
import {
  IUpdateDirectorProps,
  validatePassword,
  handleFileUpload,
  executeFileUpload
} from "./ldoDirectorHelper";
import { UserRole } from "@/types";
import { handleError } from "../handleError";

export async function updateLdoDirector({
  directorUpdate,
  setActErr,
  ldoUpdate,
  uploadedLogo,
  setIsLoading,
  user,
  mutateUser,
  updateDirector: updateDirectorMutation,
  ldoId,
  refetchFunc
}: IUpdateDirectorProps): Promise<void> {
  const directorUpdateObj = { ...directorUpdate };

  // Handle password validation and cleanup
  if (directorUpdateObj.password && directorUpdateObj.password !== '') {
    if (!validatePassword(directorUpdateObj.password, directorUpdateObj.confirmPassword!, setActErr)) {
      return;
    }
  } else {
    delete directorUpdateObj.password;
  }
  delete directorUpdateObj.confirmPassword;

  const formData = new FormData();
  const updateArgs = { ...ldoUpdate, ...directorUpdateObj };
  const updateVar = { input: updateArgs };

  // Add admin-specific parameter
  // @ts-ignore
  if (user.info?.role === UserRole.admin) updateVar.dId = ldoId;

  try {
    // Handle file upload if needed
    await handleFileUpload(formData, UPDATE_DIRECTOR_RAW, updateVar, uploadedLogo);
    
    setIsLoading(true);

    if (uploadedLogo.current) {
      // File upload path
      await executeFileUpload(formData, BACKEND_URL);
    } else {
      // Regular mutation path based on user role
      if (user.info?.role === UserRole.captain) {
        await mutateUser({ variables: { userId: user.info._id, updateInput: directorUpdateObj } });
      } else {
        await updateDirectorMutation({ variables: updateVar });
      }
    }

    setActErr(null);
    if (refetchFunc) await refetchFunc();
  } catch (error: any) {
    console.error('Error during director update:', error);
    handleError(error);
    setActErr(error);
  } finally {
    setIsLoading(false);
  }
}