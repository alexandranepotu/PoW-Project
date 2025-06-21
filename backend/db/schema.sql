CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO news (title, content) VALUES
('Adoptathon Weekend!', 'Join us this weekend for our big Adoptathon event! Dozens of cats and dogs are looking for loving homes. Free starter kits for all adopters.'),
('Pet Vaccination Drive', 'A free vaccination drive for all adopted pets will be held on July 5th at the city park. Bring your adoption papers!'),
('New Feature: Pet Profiles', 'You can now create detailed profiles for your pets, including photos and medical history. Check out the new feature on your dashboard.'),
('Volunteer Opportunities', 'We are looking for volunteers to help with our upcoming events and daily shelter activities. Sign up through your profile page.'),
('Success Story: Bella Finds a Home', 'Bella, our 2-year-old Labrador, has found her forever family! Thank you to everyone who shared her story.');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
);

CREATE TABLE animals (
    animal_id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    species VARCHAR(30),
    breed VARCHAR(50),
    age INT,
    sex VARCHAR(10),
    health_status TEXT,
    available BOOLEAN DEFAULT TRUE,
    added_by INT REFERENCES users(user_id),
    pickup_address TEXT,
    description TEXT
);

CREATE TABLE adoptions (
    adoption_id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES animals(animal_id),
    adopter_id INT REFERENCES users(user_id),
    adoption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE feeding_calendar (
    feed_id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES animals(animal_id),
    feed_time TIMESTAMP,
    food_type VARCHAR(100),
    notes TEXT
);

CREATE TABLE medical_history (
    record_id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES animals(animal_id),
    date_of_event DATE,
    description TEXT,
    treatment TEXT,
    emergency BOOLEAN
);

CREATE TABLE media_resources (
    media_id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES animals(animal_id),
    type VARCHAR(10),
    file_path TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE VIEW recent_available_adoptions AS
SELECT a.animal_id, a.name, a.species, a.pickup_address
FROM animals a
WHERE a.available = TRUE
ORDER BY a.animal_id DESC;

CREATE VIEW recent_medical_records AS
SELECT m.*, a.name
FROM medical_history m
JOIN animals a ON m.animal_id = a.animal_id
WHERE m.date_of_event > CURRENT_DATE - INTERVAL '30 days';

CREATE OR REPLACE FUNCTION get_animal_age(p_animal_id INT)
RETURNS INT AS $$
DECLARE
    v_age INT;
BEGIN
    SELECT age INTO v_age FROM animals WHERE animal_id = p_animal_id;
    RETURN v_age;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE feed_animal(p_animal_id INT, p_food TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO feeding_calendar(animal_id, feed_time, food_type)
    VALUES (p_animal_id, CURRENT_TIMESTAMP, p_food);
END;
$$;

CREATE OR REPLACE FUNCTION trg_set_unavailable()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE animals SET available = FALSE WHERE animal_id = NEW.animal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_adoption
AFTER INSERT ON adoptions
FOR EACH ROW EXECUTE FUNCTION trg_set_unavailable();

CREATE OR REPLACE FUNCTION trg_emergency_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.emergency THEN
        RAISE NOTICE 'Medical emergency for animal with ID %', NEW.animal_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_medical_insert
AFTER INSERT ON medical_history
FOR EACH ROW EXECUTE FUNCTION trg_emergency_alert();

CREATE TABLE user_addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    country VARCHAR(100),
    county VARCHAR(100),
    city VARCHAR(100),
    street VARCHAR(255),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
--performanta la cautare dupa user_id, optimizare join, fk

--aplicatii adoptii 
CREATE TABLE adoption_applications (
    application_id SERIAL PRIMARY KEY,
    pet_id INT REFERENCES animals(animal_id),
    applicant_id INT REFERENCES users(user_id),
    owner_id INT REFERENCES users(user_id),
    answers TEXT, -- data sub forma de json sau text
    status VARCHAR(20) DEFAULT 'pending', -- pending/accepted/declined
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_applicant_id ON adoption_applications(applicant_id);
CREATE INDEX idx_applications_owner_id ON adoption_applications(owner_id);
CREATE INDEX idx_applications_pet_id ON adoption_applications(pet_id);


ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

--user admin initial (parola e admin123)
INSERT INTO users (username, password_hash, email, full_name, is_admin) 
VALUES (
    'admin', 
    '$2y$10$NQ4C7PJHu3gXr4JJF0RJo.pI5vBpFr1G9YjOQ4YYDsAOTgCEhb1Uy',
    'admin@petadoption.com',
    'System Administrator',
    TRUE
) ON CONFLICT (username) DO UPDATE 
SET is_admin = TRUE,
    password_hash = '$2y$10$NQ4C7PJHu3gXr4JJF0RJo.pI5vBpFr1G9YjOQ4YYDsAOTgCEhb1Uy'
WHERE users.username = 'admin';

--chat rooms pt fiecare conv la fiecare animal
CREATE TABLE chat_rooms (
    room_id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES animals(animal_id),
    interested_user_id INT REFERENCES users(user_id),
    owner_id INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' -- active, closed
);

-- msj in fiecare chat room
CREATE TABLE chat_messages (
    message_id SERIAL PRIMARY KEY,
    room_id INT REFERENCES chat_rooms(room_id),
    sender_id INT REFERENCES users(user_id),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' -- sent, delivered, read
);

-- index pt preluare msj repede
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);

-- index pt gasirea chat rooms a user-ului
CREATE INDEX idx_chat_rooms_interested_user ON chat_rooms(interested_user_id);
CREATE INDEX idx_chat_rooms_owner ON chat_rooms(owner_id);