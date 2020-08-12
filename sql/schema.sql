CREATE TABLE IF NOT EXISTS userstates (
  id SERIAL PRIMARY KEY,
  "stateName" VARCHAR(50),
  "updatedTime" VARCHAR(200),
  positive VARCHAR(50),
  negative VARCHAR(50),
  "hospitalizedCurrently" VARCHAR(50),
  recovered VARCHAR(50),
  death VARCHAR(50),
  "totalTest" VARCHAR(50),
  "positiveTests" VARCHAR(50),
  "negativeTests" VARCHAR(50)
);
