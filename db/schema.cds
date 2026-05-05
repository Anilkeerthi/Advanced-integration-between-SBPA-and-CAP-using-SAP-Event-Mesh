namespace my.app;

entity ProcessEvents {
  key ID           : UUID;
  processId        : String;
  processType      : String;
  outcome          : String;
  completedAt      : Timestamp;
  payload          : LargeString; 
  createdAt        : Timestamp @cds.on.insert : $now;
}


entity ProcessAnalysis {
  key ID           : UUID;
  event            : Association to ProcessEvents;
  summary          : LargeString;
  recommendations  : LargeString;
  sentiment        : String;
  analysedAt       : Timestamp @cds.on.insert : $now;
}
