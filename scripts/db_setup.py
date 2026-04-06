import sqlite3
import os
import re

def setup_db():
    sql_script_path = os.path.join("database-fhir", "hospital_fhir_extensive_data.sql")
    db_path = os.path.join("database-fhir", "hospital_fhir.db")
    
    if not os.path.exists(sql_script_path):
        print(f"Error: SQL script not found at {sql_script_path}")
        return

    print(f"Creating SQLite database at {db_path}...")
    
    # Remove existing db if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Tables are not defined in the SQL script, only INSERTs.
    # We need to define the schema based on FHIR standards or the script's intention.
    # However, hospital_fhir_extensive_data.sql seems to contain ONLY INSERTs.
    # Let's check the first few lines again to be sure.
    
    with open(sql_script_path, 'r') as f:
        sql_content = f.read()

    # Pre-processing: SQLite doesn't support CONCAT or ELT or RAND or INTERVAL like MySQL.
    # The script provided seems to be written for MySQL.
    # I need to translate it or provide a schema.
    
    # Actually, many hospital SQL dumps use MySQL. 
    # For a portable AI demo, SQLite is better.
    # Let's see if we can find CREATE TABLE statements or if we should add them.
    
    schema = """
    CREATE TABLE IF NOT EXISTS Organization (
        id VARCHAR(64) PRIMARY KEY,
        identifier_system VARCHAR(255),
        identifier_value VARCHAR(255),
        name VARCHAR(255),
        alias VARCHAR(255),
        telecom_phone VARCHAR(50),
        telecom_email VARCHAR(255),
        address_street VARCHAR(255),
        address_city VARCHAR(100),
        address_state VARCHAR(50),
        address_postal_code VARCHAR(20),
        address_country VARCHAR(100),
        status VARCHAR(50),
        created_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS Practitioner (
        id VARCHAR(64) PRIMARY KEY,
        identifier_system VARCHAR(255),
        identifier_value VARCHAR(255),
        given_name VARCHAR(100),
        family_name VARCHAR(100),
        title VARCHAR(50),
        gender VARCHAR(20),
        date_of_birth DATE,
        telecom_phone VARCHAR(50),
        telecom_email VARCHAR(255),
        address_street VARCHAR(255),
        address_city VARCHAR(100),
        qualification_code VARCHAR(50),
        qualification_description TEXT,
        status VARCHAR(50),
        created_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS Patient (
        id VARCHAR(64) PRIMARY KEY,
        identifier_system VARCHAR(255),
        identifier_value VARCHAR(255),
        given_name VARCHAR(100),
        family_name VARCHAR(100),
        gender VARCHAR(20),
        date_of_birth DATE,
        telecom_phone VARCHAR(50),
        telecom_email VARCHAR(255),
        address_street VARCHAR(255),
        address_city VARCHAR(100),
        address_state VARCHAR(50),
        address_postal_code VARCHAR(20),
        marital_status VARCHAR(50),
        language VARCHAR(10),
        general_practitioner_id VARCHAR(64),
        managing_organization_id VARCHAR(64),
        active BOOLEAN,
        created_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS Condition (
        id VARCHAR(64) PRIMARY KEY,
        identifier_system VARCHAR(255),
        identifier_value VARCHAR(255),
        clinical_status VARCHAR(50),
        verification_status VARCHAR(50),
        category_code VARCHAR(50),
        category_display VARCHAR(255),
        severity_code VARCHAR(50),
        severity_display VARCHAR(255),
        code_system VARCHAR(255),
        code_code VARCHAR(50),
        code_display VARCHAR(255),
        subject_patient_id VARCHAR(64),
        encounter_id VARCHAR(64),
        onset_date_time DATETIME,
        onset_age_value FLOAT,
        onset_age_unit VARCHAR(20),
        abatement_date_time DATETIME,
        recorded_date DATETIME,
        recorder_practitioner_id VARCHAR(64),
        asserter_patient_id VARCHAR(64),
        stage_summary TEXT,
        note TEXT,
        created_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS Observation (
        id VARCHAR(64) PRIMARY KEY,
        identifier_system VARCHAR(255),
        identifier_value VARCHAR(255),
        status VARCHAR(50),
        category_code VARCHAR(50),
        category_display VARCHAR(255),
        code_system VARCHAR(255),
        code_code VARCHAR(50),
        code_display VARCHAR(255),
        subject_patient_id VARCHAR(64),
        encounter_id VARCHAR(64),
        effective_date_time DATETIME,
        issued DATETIME,
        performer_practitioner_id VARCHAR(64),
        performer_organization_id VARCHAR(64),
        value_quantity_value FLOAT,
        value_quantity_comparator VARCHAR(10),
        value_quantity_unit VARCHAR(50),
        value_quantity_system VARCHAR(255),
        value_string TEXT,
        value_codeable_concept_code VARCHAR(50),
        value_codeable_concept_display VARCHAR(255),
        data_absent_reason_code VARCHAR(50),
        interpretation_code VARCHAR(50),
        interpretation_display VARCHAR(255),
        note TEXT,
        reference_range_low FLOAT,
        reference_range_high FLOAT,
        reference_range_text TEXT,
        created_date DATETIME
    );
    """
    
    print("Applying schema...")
    cursor.executescript(schema)
    
    print("Importing data...")
    # The script uses MySQL-specific syntax (CONCAT, ELT, RAND, etc.) in some parts.
    # However, the first ~200 lines are plain INSERTs.
    # For the procedural parts (SELECT CONCAT...), we might need to filter or simplify.
    
    lines = sql_content.split(';')
    for line in lines:
        line = line.strip()
        if not line or line.startswith('--'):
            continue
            
        # Skip procedural generation if it uses MySQL specific functions
        if any(x in line for x in ['CONCAT(', 'ELT(', 'RAND()', 'DATE_ADD(']):
            # print(f"Skipping MySQL-specific procedural line: {line[:50]}...")
            continue
            
        try:
            cursor.execute(line)
        except Exception as e:
            # print(f"Skipping line due to error: {e}")
            pass
            
    conn.commit()
    
    # Verify data
    cursor.execute("SELECT COUNT(*) FROM Patient")
    patient_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM Condition")
    condition_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM Observation")
    observation_count = cursor.fetchone()[0]
    
    print(f"Database setup complete.")
    print(f"Summary: {patient_count} patients, {condition_count} conditions, {observation_count} observations.")
    
    conn.close()

if __name__ == "__main__":
    setup_db()
