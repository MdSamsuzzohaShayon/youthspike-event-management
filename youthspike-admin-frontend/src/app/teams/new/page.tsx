import { redirect } from 'next/navigation';
import NewTeamComp from '@/components/teams/NewTeamComp';
import { TParams } from '@/types';
import { LDO_ID } from '@/utils/constant';

interface INewTeamPageProps {
  searchParams: Promise<TParams>;
}

const DEFAULT_LDO_ID = '68afc4b20bf9dbb4ac0f6984';

/**
 * Pure function to build a relative redirect URL.
 * Preserves existing search params and injects the default LDO_ID.
 *
 * @param currentParams - The resolved search parameters object.
 * @param ldoIdKey - The key string for the LDO ID.
 * @param defaultId - The default LDO ID to inject.
 * @returns A relative URL string with the updated query parameters.
 */
function buildRedirectUrl(
  currentParams: Record<string, string>,
  ldoIdKey: string,
  defaultId: string
): string {
  const urlSearchParams = new URLSearchParams();

  // Iterate through existing parameters and append them
  for (const [key, value] of Object.entries(currentParams)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        urlSearchParams.append(key, String(item));
      }
    } else {
      urlSearchParams.append(key, String(value));
    }
  }

  // Overwrite or set the default LDO_ID
  urlSearchParams.set(ldoIdKey, defaultId);

  return `?${urlSearchParams.toString()}`;
}

export default async function NewTeamPage({ searchParams }: INewTeamPageProps) {
  let resolvedParams: TParams;

  // 1. Gracefully resolve the searchParams Promise
  try {
    resolvedParams = await searchParams;
  } catch (error) {
    console.error('Failed to resolve search params:', error);
    // Fallback to redirect with just the default ID if params fail to resolve
    redirect(`?${LDO_ID}=${DEFAULT_LDO_ID}`);
  }

  // 2. Check for the presence of ldoId
  const ldoId = resolvedParams[LDO_ID];

  // 3. If missing, build the redirect URL and redirect
  // Note: redirect() throws a NEXT_REDIRECT error internally to halt execution.
  if (!ldoId) {
    const redirectUrl = buildRedirectUrl(
      resolvedParams,
      LDO_ID,
      DEFAULT_LDO_ID
    );
    redirect(redirectUrl);
  }

  // 4. Render the component with the original searchParams Promise
  return <NewTeamComp searchParams={searchParams} />;
}
