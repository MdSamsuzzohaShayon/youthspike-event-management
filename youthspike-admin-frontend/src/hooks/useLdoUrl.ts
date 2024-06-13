import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const useLdoUrl = () => {
    const [ldoUrlStr, setLdoUrlStr] = useState<string>('');
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('ldoId')) {
            setLdoUrlStr(`?ldoId=${searchParams.get('ldoId')}`);
        }
    }, [searchParams]);

    return ldoUrlStr;
}

export default useLdoUrl;