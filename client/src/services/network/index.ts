import networkMonitorService from './network-monitor.service';
import { INetworkMonitorService, NetworkStatus, NetworkStatusCallback, NetworkTypeCallback } from './network-monitor.interface';

export {
  networkMonitorService
};
export type {
  INetworkMonitorService,
  NetworkStatus,
  NetworkStatusCallback,
  NetworkTypeCallback
};

export default networkMonitorService;