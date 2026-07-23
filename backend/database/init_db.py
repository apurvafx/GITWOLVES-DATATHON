import sqlite3
import os
import random
from datetime import datetime, timedelta

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "ksp_crime.db")

def init_database():
    print(f"Initializing database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Drop existing tables if any (for clean initialization)
    tables = [
        "FinancialTransactions", "ActSectionAssociation", "ComplainantDetails", 
        "Victim", "Accused", "ArrestSurrender", "CaseMaster", 
        "CrimeHeadActSection", "Section", "Act", "Employee", 
        "Unit", "UnitType", "Rank", "Designation", "CrimeSubHead", 
        "CrimeHead", "CasteMaster", "ReligionMaster", "OccupationMaster", 
        "CaseStatusMaster", "Court", "District", "State", "CaseCategory", "GravityOffence"
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table};")

    # Create Tables
    cursor.execute("""
    CREATE TABLE State (
        StateID INTEGER PRIMARY KEY,
        StateName VARCHAR(100),
        NationalityID INT,
        Active BIT
    );
    """)

    cursor.execute("""
    CREATE TABLE District (
        DistrictID INTEGER PRIMARY KEY,
        DistrictName VARCHAR(100),
        StateID INT,
        Active BIT,
        FOREIGN KEY(StateID) REFERENCES State(StateID)
    );
    """)

    cursor.execute("""
    CREATE TABLE UnitType (
        UnitTypeID INTEGER PRIMARY KEY,
        UnitTypeName VARCHAR(100),
        CityDistState VARCHAR(50),
        Hierarchy INT,
        Active BIT
    );
    """)

    cursor.execute("""
    CREATE TABLE Unit (
        UnitID INTEGER PRIMARY KEY,
        UnitName VARCHAR(100),
        TypeID INT,
        ParentUnit INT,
        NationalityID INT,
        StateID INT,
        DistrictID INT,
        Active BIT,
        FOREIGN KEY(TypeID) REFERENCES UnitType(UnitTypeID),
        FOREIGN KEY(StateID) REFERENCES State(StateID),
        FOREIGN KEY(DistrictID) REFERENCES District(DistrictID)
    );
    """)

    cursor.execute("""
    CREATE TABLE Rank (
        RankID INTEGER PRIMARY KEY,
        RankName VARCHAR(100),
        Hierarchy INT,
        Active BIT
    );
    """)

    cursor.execute("""
    CREATE TABLE Designation (
        DesignationID INTEGER PRIMARY KEY,
        DesignationName VARCHAR(100),
        Active BIT,
        SortOrder INT
    );
    """)

    cursor.execute("""
    CREATE TABLE Employee (
        EmployeeID INTEGER PRIMARY KEY,
        DistrictID INT,
        UnitID INT,
        RankID INT,
        DesignationID INT,
        KGID VARCHAR(30) UNIQUE,
        FirstName VARCHAR(100),
        EmployeeDOB DATE,
        GenderID INT,
        AppointmentDate DATE,
        FOREIGN KEY(DistrictID) REFERENCES District(DistrictID),
        FOREIGN KEY(UnitID) REFERENCES Unit(UnitID),
        FOREIGN KEY(RankID) REFERENCES Rank(RankID),
        FOREIGN KEY(DesignationID) REFERENCES Designation(DesignationID)
    );
    """)

    cursor.execute("""
    CREATE TABLE CaseCategory (
        CaseCategoryID INTEGER PRIMARY KEY,
        LookupValue VARCHAR(50)
    );
    """)

    cursor.execute("""
    CREATE TABLE GravityOffence (
        GravityOffenceID INTEGER PRIMARY KEY,
        LookupValue VARCHAR(50)
    );
    """)

    cursor.execute("""
    CREATE TABLE CrimeHead (
        CrimeHeadID INTEGER PRIMARY KEY,
        CrimeGroupName VARCHAR(100),
        Active BIT
    );
    """)

    cursor.execute("""
    CREATE TABLE CrimeSubHead (
        CrimeSubHeadID INTEGER PRIMARY KEY,
        CrimeHeadID INT,
        CrimeHeadName VARCHAR(100),
        SeqID INT,
        FOREIGN KEY(CrimeHeadID) REFERENCES CrimeHead(CrimeHeadID)
    );
    """)

    cursor.execute("""
    CREATE TABLE CaseStatusMaster (
        CaseStatusID INTEGER PRIMARY KEY,
        CaseStatusName VARCHAR(100)
    );
    """)

    cursor.execute("""
    CREATE TABLE Court (
        CourtID INTEGER PRIMARY KEY,
        CourtName VARCHAR(100),
        DistrictID INT,
        StateID INT,
        Active BIT,
        FOREIGN KEY(DistrictID) REFERENCES District(DistrictID),
        FOREIGN KEY(StateID) REFERENCES State(StateID)
    );
    """)

    cursor.execute("""
    CREATE TABLE CasteMaster (
        caste_master_id INTEGER PRIMARY KEY,
        caste_master_name VARCHAR(100)
    );
    """)

    cursor.execute("""
    CREATE TABLE ReligionMaster (
        ReligionID INTEGER PRIMARY KEY,
        ReligionName VARCHAR(100)
    );
    """)

    cursor.execute("""
    CREATE TABLE OccupationMaster (
        OccupationID INTEGER PRIMARY KEY,
        OccupationName VARCHAR(100)
    );
    """)

    # Core CaseMaster Table
    cursor.execute("""
    CREATE TABLE CaseMaster (
        CaseMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
        CrimeNo VARCHAR(30) UNIQUE,
        CaseNo VARCHAR(20),
        CrimeRegisteredDate DATE,
        PolicePersonID INT,
        PoliceStationID INT,
        CaseCategoryID INT,
        GravityOffenceID INT,
        CrimeMajorHeadID INT,
        CrimeMinorHeadID INT,
        CaseStatusID INT,
        CourtID INT,
        IncidentFromDate DATETIME,
        IncidentToDate DATETIME,
        InfoReceivedPSDate DATETIME,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        BriefFacts TEXT,
        FOREIGN KEY(PolicePersonID) REFERENCES Employee(EmployeeID),
        FOREIGN KEY(PoliceStationID) REFERENCES Unit(UnitID),
        FOREIGN KEY(CaseCategoryID) REFERENCES CaseCategory(CaseCategoryID),
        FOREIGN KEY(GravityOffenceID) REFERENCES GravityOffence(GravityOffenceID),
        FOREIGN KEY(CrimeMajorHeadID) REFERENCES CrimeHead(CrimeHeadID),
        FOREIGN KEY(CrimeMinorHeadID) REFERENCES CrimeSubHead(CrimeSubHeadID),
        FOREIGN KEY(CaseStatusID) REFERENCES CaseStatusMaster(CaseStatusID),
        FOREIGN KEY(CourtID) REFERENCES Court(CourtID)
    );
    """)

    cursor.execute("""
    CREATE TABLE ComplainantDetails (
        ComplainantID INTEGER PRIMARY KEY AUTOINCREMENT,
        CaseMasterID INT,
        ComplainantName VARCHAR(100),
        AgeYear INT,
        OccupationID INT,
        ReligionID INT,
        CasteID INT,
        GenderID INT,
        FOREIGN KEY(CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
        FOREIGN KEY(OccupationID) REFERENCES OccupationMaster(OccupationID),
        FOREIGN KEY(ReligionID) REFERENCES ReligionMaster(ReligionID),
        FOREIGN KEY(CasteID) REFERENCES CasteMaster(caste_master_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE Victim (
        VictimMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
        CaseMasterID INT,
        VictimName VARCHAR(100),
        AgeYear INT,
        GenderID INT,
        VictimPolice VARCHAR(1),
        FOREIGN KEY(CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
    );
    """)

    cursor.execute("""
    CREATE TABLE Accused (
        AccusedMasterID INTEGER PRIMARY KEY AUTOINCREMENT,
        CaseMasterID INT,
        AccusedName VARCHAR(100),
        AgeYear INT,
        GenderID INT,
        PersonID VARCHAR(10), -- A1, A2, A3...
        FOREIGN KEY(CaseMasterID) REFERENCES CaseMaster(CaseMasterID)
    );
    """)

    cursor.execute("""
    CREATE TABLE ArrestSurrender (
        ArrestSurrenderID INTEGER PRIMARY KEY AUTOINCREMENT,
        CaseMasterID INT,
        ArrestSurrenderTypeID INT,
        ArrestSurrenderDate DATE,
        ArrestSurrenderStateId INT,
        ArrestSurrenderDistrictId INT,
        PoliceStationID INT,
        IOID INT,
        CourtID INT,
        AccusedMasterID INT,
        IsAccused BIT,
        IsComplainantAccused BIT,
        FOREIGN KEY(CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
        FOREIGN KEY(ArrestSurrenderStateId) REFERENCES State(StateID),
        FOREIGN KEY(ArrestSurrenderDistrictId) REFERENCES District(DistrictID),
        FOREIGN KEY(PoliceStationID) REFERENCES Unit(UnitID),
        FOREIGN KEY(IOID) REFERENCES Employee(EmployeeID),
        FOREIGN KEY(CourtID) REFERENCES Court(CourtID),
        FOREIGN KEY(AccusedMasterID) REFERENCES Accused(AccusedMasterID)
    );
    """)

    cursor.execute("""
    CREATE TABLE Act (
        ActCode VARCHAR(50) PRIMARY KEY,
        ActDescription VARCHAR(200),
        ShortName VARCHAR(50),
        Active BIT
    );
    """)

    cursor.execute("""
    CREATE TABLE Section (
        ActCode VARCHAR(50),
        SectionCode VARCHAR(50),
        SectionDescription VARCHAR(200),
        Active BIT,
        PRIMARY KEY (ActCode, SectionCode),
        FOREIGN KEY(ActCode) REFERENCES Act(ActCode)
    );
    """)

    cursor.execute("""
    CREATE TABLE ActSectionAssociation (
        CaseMasterID INT,
        ActID VARCHAR(50),
        SectionID VARCHAR(50),
        ActOrderID INT,
        SectionOrderID INT,
        PRIMARY KEY (CaseMasterID, ActID, SectionID),
        FOREIGN KEY(CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
        FOREIGN KEY(ActID, SectionID) REFERENCES Section(ActCode, SectionCode)
    );
    """)

    # Added Custom FinancialTransactions Table to satisfy Requirement 7 (Financial Crime trails)
    cursor.execute("""
    CREATE TABLE FinancialTransactions (
        TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
        CaseMasterID INT,
        AccusedMasterID INT,
        SourceAccount VARCHAR(50),
        DestinationAccount VARCHAR(50),
        Amount DECIMAL(15, 2),
        TransactionDate DATETIME,
        IsSuspicious BIT,
        FOREIGN KEY(CaseMasterID) REFERENCES CaseMaster(CaseMasterID),
        FOREIGN KEY(AccusedMasterID) REFERENCES Accused(AccusedMasterID)
    );
    """)

    conn.commit()
    print("Tables created successfully.")
    
    # --- Populating Mock Data ---
    
    # 1. State
    cursor.execute("INSERT INTO State VALUES (1, 'Karnataka', 1, 1);")
    
    # 2. Districts (Karnataka specific)
    districts = [
        (1, "Bengaluru City", 1, 1),
        (2, "Mysuru City", 1, 1),
        (3, "Hubballi-Dharwad City", 1, 1),
        (4, "Mangaluru City", 1, 1),
        (5, "Belagavi", 1, 1),
    ]
    cursor.executemany("INSERT INTO District VALUES (?, ?, ?, ?);", districts)
    
    # 3. Unit Types
    unit_types = [
        (1, "Commissioner Office", "City", 1, 1),
        (2, "Police Station", "District", 2, 1),
        (3, "Circle Office", "District", 3, 1),
    ]
    cursor.executemany("INSERT INTO UnitType VALUES (?, ?, ?, ?, ?);", unit_types)
    
    # 4. Units (Police Stations in Karnataka)
    units = [
        (101, "Koramangala PS", 2, 1, 1, 1, 1, 1),
        (102, "Indiranagar PS", 2, 1, 1, 1, 1, 1),
        (103, "Electronic City PS", 2, 1, 1, 1, 1, 1),
        (201, "Devaraja PS", 2, 1, 1, 1, 2, 1),
        (202, "Lashkar PS", 2, 1, 1, 1, 2, 1),
        (301, "Suburban PS Hubballi", 2, 1, 1, 1, 3, 1),
    ]
    cursor.executemany("INSERT INTO Unit VALUES (?, ?, ?, ?, ?, ?, ?, ?);", units)
    
    # 5. Ranks
    ranks = [
        (1, "Director General of Police (DGP)", 1, 1),
        (2, "Superintendent of Police (SP)", 5, 1),
        (3, "Police Inspector", 10, 1),
        (4, "Sub-Inspector (PSI)", 12, 1),
        (5, "Head Constable", 15, 1),
        (6, "Constable", 18, 1),
    ]
    cursor.executemany("INSERT INTO Rank VALUES (?, ?, ?, ?);", ranks)
    
    # 6. Designations
    designations = [
        (1, "Investigating Officer (IO)", 1, 1),
        (2, "Station House Officer (SHO)", 1, 2),
        (3, "Crime Writer", 1, 3),
    ]
    cursor.executemany("INSERT INTO Designation VALUES (?, ?, ?, ?);", designations)
    
    # 7. Employees (Karnataka Police Officers)
    employees = [
        (1001, 1, 101, 3, 1, "KGID-KA99102", "Manjunath", "1978-05-12", 1, "2002-08-15"),
        (1002, 1, 102, 4, 1, "KGID-KA99144", "Anitha", "1985-11-23", 2, "2010-02-10"),
        (1003, 1, 103, 3, 2, "KGID-KA99182", "Raghavendra", "1980-02-28", 1, "2004-06-20"),
        (2001, 2, 201, 3, 1, "KGID-KA98101", "Shivashankar", "1975-09-30", 1, "1999-01-14"),
        (2002, 2, 202, 4, 1, "KGID-KA98156", "Harish", "1988-04-18", 1, "2012-07-01"),
    ]
    cursor.executemany("INSERT INTO Employee VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", employees)
    
    # 8. Case Categories
    categories = [(1, "FIR"), (2, "UDR"), (3, "Zero FIR"), (4, "PAR")]
    cursor.executemany("INSERT INTO CaseCategory VALUES (?, ?);", categories)
    
    # 9. Gravity Offence
    gravity = [(1, "Heinous"), (2, "Non-Heinous")]
    cursor.executemany("INSERT INTO GravityOffence VALUES (?, ?);", gravity)
    
    # 10. Crime Heads (Major classification)
    crime_heads = [
        (1, "Crimes Against Body", 1),
        (2, "Crimes Against Property", 1),
        (3, "Cyber Crime", 1),
        (4, "Financial & White Collar Crime", 1),
    ]
    cursor.executemany("INSERT INTO CrimeHead VALUES (?, ?, ?);", crime_heads)
    
    # 11. Crime Sub Heads (Minor classification)
    crime_subheads = [
        (1, 1, "Murder", 1),
        (2, 1, "Attempt to Murder", 2),
        (3, 2, "Robbery", 3),
        (4, 2, "House Breaking By Day", 4),
        (5, 3, "Phishing & Identity Theft", 5),
        (6, 3, "Online Financial Fraud", 6),
        (7, 4, "Cheating & Forgery", 7),
    ]
    cursor.executemany("INSERT INTO CrimeSubHead VALUES (?, ?, ?, ?);", crime_subheads)
    
    # 12. Case Status Master
    status = [
        (1, "Under Investigation"),
        (2, "Charge Sheeted"),
        (3, "Closed - Undetected"),
        (4, "Closed - False Case"),
    ]
    cursor.executemany("INSERT INTO CaseStatusMaster VALUES (?, ?);", status)
    
    # 13. Courts
    courts = [
        (1, "City Civil Court Bengaluru", 1, 1, 1),
        (2, "JMFC Court Mysuru", 2, 1, 1),
        (3, "High Court of Karnataka", 1, 1, 1),
    ]
    cursor.executemany("INSERT INTO Court VALUES (?, ?, ?, ?, ?);", courts)
    
    # 14. Castes
    castes = [(1, "General"), (2, "OBC"), (3, "SC"), (4, "ST")]
    cursor.executemany("INSERT INTO CasteMaster VALUES (?, ?);", castes)
    
    # 15. Religions
    religions = [(1, "Hindu"), (2, "Muslim"), (3, "Christian"), (4, "Sikh")]
    cursor.executemany("INSERT INTO ReligionMaster VALUES (?, ?);", religions)
    
    # 16. Occupations
    occupations = [
        (1, "Farmer"), (2, "Software Engineer"), (3, "Business Owner"), 
        (4, "Laborer"), (5, "Unemployed"), (6, "Student")
    ]
    cursor.executemany("INSERT INTO OccupationMaster VALUES (?, ?);", occupations)

    # 17. Acts
    acts = [
        ("IPC", "Indian Penal Code", "IPC", 1),
        ("NDPS", "Narcotic Drugs and Psychotropic Substances Act", "NDPS", 1),
        ("IT_ACT", "Information Technology Act", "IT Act", 1),
    ]
    cursor.executemany("INSERT INTO Act VALUES (?, ?, ?, ?);", acts)

    # 18. Sections
    sections = [
        ("IPC", "302", "Punishment for murder", 1),
        ("IPC", "307", "Attempt to murder", 1),
        ("IPC", "392", "Punishment for robbery", 1),
        ("IPC", "454", "Lurking house-trespass", 1),
        ("IT_ACT", "66D", "Cheating by personation using computer resource", 1),
        ("IPC", "420", "Cheating and dishonestly inducing delivery of property", 1),
    ]
    cursor.executemany("INSERT INTO Section VALUES (?, ?, ?, ?);", sections)

    conn.commit()

    # 19. CaseMaster Records (Let's generate 4 highly connected, detailed cases)
    # Bengaluru coordinates center around: Lat 12.9716, Long 77.5946
    # Mysuru coordinates center around: Lat 12.2958, Long 76.6394
    cases = [
        # Case 1: Cyber Fraud in Koramangala, Bengaluru (Accused: Rajesh Gowda)
        (
            1, "104430006202600001", "202600001", "2026-02-10", 1001, 101, 1, 2, 3, 6, 1, 1,
            "2026-02-09 14:30:00", "2026-02-09 16:00:00", "2026-02-10 10:00:00",
            12.9352, 77.6244, # Koramangala
            "The complainant stated that they received a WhatsApp message with a phishing link pretending to be from Bengaluru Electricity Supply Company (BESCOM) threatening power disconnection. Upon clicking, Rs. 1,50,000 was debited from their bank account in three transfers."
        ),
        # Case 2: House Breaking / Robbery in Indiranagar, Bengaluru (Accused: Rajesh Gowda & Suresh Hegde)
        (
            2, "104430006202600002", "202600002", "2026-03-01", 1002, 102, 1, 1, 2, 4, 1, 1,
            "2026-02-28 23:00:00", "2026-03-01 04:00:00", "2026-03-01 08:00:00",
            12.9784, 77.6408, # Indiranagar
            "Unidentified thieves broke into the locked residence in Indiranagar by breaking the terrace door lock. They stole gold jewelry worth Rs. 5,00,000 and two laptops. Suspect vehicle captured on CCTV matched a black hatchback."
        ),
        # Case 3: Cyber Fraud in Electronic City, Bengaluru (Accused: Suresh Hegde & Vikram Malhotra)
        (
            3, "104430006202600003", "202600003", "2026-04-15", 1003, 103, 1, 2, 3, 5, 1, 1,
            "2026-04-14 10:00:00", "2026-04-14 11:30:00", "2026-04-15 09:00:00",
            12.8452, 77.6632, # Electronic City
            "Identity theft case where suspect cloned the complainant's SIM card and accessed net banking details to steal Rs. 4,00,000. Funds were funneled into multiple suspect mule bank accounts."
        ),
        # Case 4: Robbery/Attempted Murder in Lashkar, Mysuru (Accused: Vikram Malhotra)
        (
            4, "104430006202600004", "202600004", "2026-05-20", 2002, 202, 1, 1, 1, 2, 2, 2,
            "2026-05-19 21:30:00", "2026-05-19 22:00:00", "2026-05-20 06:00:00",
            12.3162, 76.6575, # Lashkar, Mysuru
            "Suspect attacked a shopkeeper with a sharp weapon when he resisted a robbery attempt. Suspect stole cash box containing Rs. 85,000 and fled. Accused Vikram Malhotra arrested on matching descriptions."
        )
    ]
    cursor.executemany("""
    INSERT INTO CaseMaster (
        CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, 
        CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, 
        IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, cases)

    # 20. Complainants
    complainants = [
        (1, 1, "Kiran Gowda", 34, 2, 1, 1, 1),
        (2, 2, "Shubha Murthy", 56, 3, 1, 1, 2),
        (3, 3, "Mohammed Yusuf", 42, 2, 2, 2, 1),
        (4, 4, "Venkatesh Rao", 61, 3, 1, 1, 1),
    ]
    cursor.executemany("INSERT INTO ComplainantDetails VALUES (?, ?, ?, ?, ?, ?, ?, ?);", complainants)

    # 21. Victims
    victims = [
        (1, 1, "Kiran Gowda", 34, 1, "0"),
        (2, 2, "Shubha Murthy", 56, 2, "0"),
        (3, 3, "Mohammed Yusuf", 42, 1, "0"),
        (4, 4, "Venkatesh Rao", 61, 1, "0"),
    ]
    cursor.executemany("INSERT INTO Victim VALUES (?, ?, ?, ?, ?, ?);", victims)

    # 22. Accused (highly linked network: Rajesh Gowda, Suresh Hegde, Vikram Malhotra)
    accused_list = [
        # Case 1 Accused
        (1, 1, "Rajesh Gowda", 29, 1, "A1"),
        # Case 2 Accused (Rajesh Gowda and Suresh Hegde accomplice)
        (2, 2, "Rajesh Gowda", 29, 1, "A1"),
        (3, 2, "Suresh Hegde", 31, 1, "A2"),
        # Case 3 Accused (Suresh Hegde and Vikram Malhotra accomplice)
        (4, 3, "Suresh Hegde", 31, 1, "A1"),
        (5, 3, "Vikram Malhotra", 27, 1, "A2"),
        # Case 4 Accused
        (6, 4, "Vikram Malhotra", 27, 1, "A1"),
    ]
    cursor.executemany("INSERT INTO Accused VALUES (?, ?, ?, ?, ?, ?);", accused_list)

    # 23. Act-Section Associations
    associations = [
        (1, "IT_ACT", "66D", 1, 1),
        (1, "IPC", "420", 2, 1),
        (2, "IPC", "454", 1, 1),
        (2, "IPC", "392", 2, 2),
        (3, "IT_ACT", "66D", 1, 1),
        (4, "IPC", "307", 1, 1),
        (4, "IPC", "392", 2, 2),
    ]
    cursor.executemany("INSERT INTO ActSectionAssociation VALUES (?, ?, ?, ?, ?);", associations)

    # 24. Arrest Details
    arrests = [
        # Case 4 Vikram Malhotra Arrested
        (1, 4, 1, "2026-05-21", 1, 2, 202, 2002, 2, 6, 1, 0),
        # Case 2 Suresh Hegde Arrested
        (2, 2, 1, "2026-03-05", 1, 1, 102, 1002, 1, 3, 0, 0),
    ]
    cursor.executemany("INSERT INTO ArrestSurrender VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", arrests)

    # 25. Financial Transactions (Requirement 7: Money trails linking cyber fraud to bank accounts)
    transactions = [
        # Phishing from Case 1
        (1, 1, 1, "ACC-KIRAN-889", "ACC-MULE-772", 50000.00, "2026-02-09 14:45:00", 1),
        (2, 1, 1, "ACC-KIRAN-889", "ACC-MULE-664", 50000.00, "2026-02-09 14:50:00", 1),
        (3, 1, 1, "ACC-KIRAN-889", "ACC-MULE-112", 50000.00, "2026-02-09 15:00:00", 1),
        # Mule accounts funneling money to Suresh Hegde's main wallet (ACC-SURESH-901)
        (4, 1, 2, "ACC-MULE-772", "ACC-SURESH-901", 45000.00, "2026-02-09 16:30:00", 1),
        (5, 1, 2, "ACC-MULE-664", "ACC-SURESH-901", 45000.00, "2026-02-09 16:35:00", 1),
        # Case 3 SIM cloning transfers
        (6, 3, 4, "ACC-VICTIM-991", "ACC-MULE-112", 200000.00, "2026-04-14 10:15:00", 1),
        (7, 3, 5, "ACC-MULE-112", "ACC-VIKRAM-442", 150000.00, "2026-04-14 12:00:00", 1),
    ]
    cursor.executemany("INSERT INTO FinancialTransactions VALUES (?, ?, ?, ?, ?, ?, ?, ?);", transactions)

    conn.commit()
    conn.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    # Ensure database directory exists
    os.makedirs(DB_DIR, exist_ok=True)
    init_database()
