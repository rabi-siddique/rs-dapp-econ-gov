type NetworkNotice = {
  start: string;
  // In the future this might be optional to indicate that it's user-dismissable.
  // In that case the client would need some persistent state, perhaps keyed by `message`.
  end: string;
  message: string;
};

export type MinimalNetworkConfig = {
  rpcAddrs: string[];
  chainName: string;
  notices?: NetworkNotice[];
};

export const activeNotices = (
  config: Pick<MinimalNetworkConfig, 'notices'>,
) => {
  const { notices } = config;
  if (!notices) return [];

  const now = Date.now();
  const active = notices.filter(n => {
    const startD = Date.parse(n.start);
    if (startD > now) {
      return false;
    }
    const endD = Date.parse(n.end);
    return startD < endD;
  });
  return active.map(n => n.message);
};

export const fetchNetworkConfig = async url => {
  console.log('fetchNetworkConfig: fetch', url); // log net IO
  const res = await fetch(url);
  if (!res.ok) {
    throw Error(`Cannot fetch network: ${res.status}`);
  }
  return await res.json();
};
