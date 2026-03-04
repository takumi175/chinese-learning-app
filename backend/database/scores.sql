DROP TABLE IF EXISTS scores;

CREATE TABLE scores (
    user_id INT REFERENCES users(id),
    start_id INT NOT NULL,
    mode TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    PRIMARY KEY(user_id, start_id, mode)
);
