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

export const loadNetworkConfig = (url: string): Promise<MinimalNetworkConfig> =>
  fetch(url).then(res => res.json());
