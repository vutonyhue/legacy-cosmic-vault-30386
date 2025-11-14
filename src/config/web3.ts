import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, bsc } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'F.U. Profile',
  projectId: '21fef48091f12692cad574a6f7753643',
  chains: [mainnet, bsc],
  ssr: false,
});
