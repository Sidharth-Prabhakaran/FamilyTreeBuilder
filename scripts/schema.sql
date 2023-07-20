
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
);


CREATE TABLE user_trees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tree_name VARCHAR(100) NOT NULL,
    access_level ENUM('view', 'edit') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE Invited_Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    tree_name VARCHAR(100) NOT NULL
);

