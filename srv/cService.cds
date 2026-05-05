using my.app as my from '../db/schema';

service ProcessService {

  entity ProcessEvents     as projection on my.ProcessEvents;
  entity ProcessAnalysis   as projection on my.ProcessAnalysis;

}