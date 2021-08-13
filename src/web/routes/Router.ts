import { Router } from 'express';
import WrapsRouter from './WrapsRouter';
import UnwrapsRouter from './UnwrapsRouter';
import { Dependencies } from '../../bootstrap';
import ConfigurationRouter from './ConfigurationRouter';
import StakingConfigurationRouter from './StakingConfigurationRouter';
import StakingBalancesRouter from './StakingBalancesRouter';
import TezosNFTsRouter from './TezosNFTsRouter';

function build(dependencies: Dependencies): Router {
  const router = Router();
  router.use('/wraps', WrapsRouter(dependencies));
  router.use('/unwraps', UnwrapsRouter(dependencies));
  router.use('/tezos-nfts', TezosNFTsRouter(dependencies));
  router.use('/configuration', ConfigurationRouter(dependencies));
  router.use(
    '/staking-configuration',
    StakingConfigurationRouter(dependencies)
  );
  router.use('/staking-balances', StakingBalancesRouter(dependencies));
  return router;
}

export default build;
