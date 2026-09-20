import {useEffect,useState} from 'react';
import {fetchBtcUsdQuote,RATE_REFRESH_MS,RATE_MAX_AGE_MS,type BtcUsdQuote} from './lib/btc-usd';

export function useBtcUsd() {
    const [quote,setQuote] = useState<BtcUsdQuote|null>(null);
    const [loading,setLoading] = useState(true);
    useEffect(()=>{
        let disposed=false;
        let pending:AbortController|null=null;
        let expiry:ReturnType<typeof setTimeout>|undefined;
        async function refresh() {
            if (disposed || pending || document.visibilityState==='hidden') return;
            const controller=new AbortController(); pending=controller;
            const timeout=setTimeout(()=>controller.abort(),10_000);
            try {
                const next=await fetchBtcUsdQuote(controller.signal);
                if (!disposed) {
                    setQuote(next);clearTimeout(expiry);
                    expiry=setTimeout(()=>setQuote(null),RATE_MAX_AGE_MS);
                }
            } catch {
                if (!disposed) {setQuote(null);clearTimeout(expiry);}
            } finally {
                clearTimeout(timeout);pending=null;
                if (!disposed) setLoading(false);
            }
        }
        function resume() {
            setQuote(current=>current && Date.now()-current.checkedAt<RATE_MAX_AGE_MS?current:null);
            void refresh();
        }
        void refresh();
        const interval=setInterval(refresh,RATE_REFRESH_MS);
        document.addEventListener('visibilitychange',resume);
        window.addEventListener('focus',resume);
        return ()=>{disposed=true;pending?.abort();clearInterval(interval);clearTimeout(expiry);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);};
    },[]);
    return {quote,loading};
}
