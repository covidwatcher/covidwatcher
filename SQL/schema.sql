CREATE TABLE IF NOT EXISTS stateData (
    id SERIAL PRIMARY KEY,
    stateName VARCHAR(50),
    postive VARCHAR(50),
    negative VARCHAR(50),
    hospitalizedCurrently VARCHAR(50),
    recovered VARCHAR(50),
    death VARCHAR(50),
    totalTest VARCHAR(50),
    postiveTests VARCHAR(50),
    negativeTests VARCHAR(50)
);
