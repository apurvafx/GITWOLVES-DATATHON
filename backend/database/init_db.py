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

    # Disable foreign keys temporarily to drop tables cleanly
    cursor.execute("PRAGMA foreign_keys = OFF;")

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
    
    cursor.execute("INSERT INTO State VALUES (1, 'Karnataka', 1, 1);")
    
    # Expanded to 12 major districts of Karnataka (Requirement 5)
    districts = [
        (1, "Bengaluru City", 1, 1),
        (2, "Mysuru City", 1, 1),
        (3, "Hubballi-Dharwad City", 1, 1),
        (4, "Mangaluru City", 1, 1),
        (5, "Belagavi", 1, 1),
        (6, "Udupi", 1, 1),
        (7, "Shivamogga", 1, 1),
        (8, "Kalaburagi", 1, 1),
        (9, "Davanagere", 1, 1),
        (10, "Tumakuru", 1, 1),
        (11, "Vijayapura", 1, 1),
        (12, "Ballari", 1, 1),
    ]
    cursor.executemany("INSERT INTO District VALUES (?, ?, ?, ?);", districts)
    
    unit_types = [
        (1, "Commissioner Office", "City", 1, 1),
        (2, "Police Station", "District", 2, 1),
        (3, "Circle Office", "District", 3, 1),
    ]
    cursor.executemany("INSERT INTO UnitType VALUES (?, ?, ?, ?, ?);", unit_types)
    
    # Expanded units to represent every one of the 12 districts
    units = [
        (101, "Koramangala PS", 2, 1, 1, 1, 1, 1),
        (102, "Indiranagar PS", 2, 1, 1, 1, 1, 1),
        (103, "Electronic City PS", 2, 1, 1, 1, 1, 1),
        (201, "Devaraja PS", 2, 1, 1, 1, 2, 1),
        (202, "Lashkar PS", 2, 1, 1, 1, 2, 1),
        (301, "Suburban PS Hubballi", 2, 1, 1, 1, 3, 1),
        (401, "Kadri PS", 2, 1, 1, 1, 4, 1),
        (501, "Belagavi Town PS", 2, 1, 1, 1, 5, 1),
        (601, "Udupi Town PS", 2, 1, 1, 1, 6, 1),
        (701, "Jayanagar PS Shimoga", 2, 1, 1, 1, 7, 1),
        (801, "Kalaburagi Town PS", 2, 1, 1, 1, 8, 1),
        (901, "Davanagere Town PS", 2, 1, 1, 1, 9, 1),
        (1001, "Tumakuru Town PS", 2, 1, 1, 1, 10, 1),
        (1101, "Vijayapura Town PS", 2, 1, 1, 1, 11, 1),
        (1201, "Ballari Town PS", 2, 1, 1, 1, 12, 1),
    ]
    cursor.executemany("INSERT INTO Unit VALUES (?, ?, ?, ?, ?, ?, ?, ?);", units)
    
    ranks = [
        (1, "Director General of Police (DGP)", 1, 1),
        (2, "Superintendent of Police (SP)", 5, 1),
        (3, "Police Inspector", 10, 1),
        (4, "Sub-Inspector (PSI)", 12, 1),
        (5, "Head Constable", 15, 1),
        (6, "Constable", 18, 1),
    ]
    cursor.executemany("INSERT INTO Rank VALUES (?, ?, ?, ?);", ranks)
    
    designations = [
        (1, "Investigating Officer (IO)", 1, 1),
        (2, "Station House Officer (SHO)", 1, 2),
        (3, "Crime Writer", 1, 3),
    ]
    cursor.executemany("INSERT INTO Designation VALUES (?, ?, ?, ?);", designations)
    
    employees = [
        (1001, 1, 101, 3, 1, "KGID-KA99102", "Manjunath", "1978-05-12", 1, "2002-08-15"),
        (1002, 1, 102, 4, 1, "KGID-KA99144", "Anitha", "1985-11-23", 2, "2010-02-10"),
        (1003, 1, 103, 3, 2, "KGID-KA99182", "Raghavendra", "1980-02-28", 1, "2004-06-20"),
        (2001, 2, 201, 3, 1, "KGID-KA98101", "Shivashankar", "1975-09-30", 1, "1999-01-14"),
        (2002, 2, 202, 4, 1, "KGID-KA98156", "Harish", "1988-04-18", 1, "2012-07-01"),
    ]
    cursor.executemany("INSERT INTO Employee VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", employees)
    
    categories = [(1, "FIR"), (2, "UDR"), (3, "Zero FIR"), (4, "PAR")]
    cursor.executemany("INSERT INTO CaseCategory VALUES (?, ?);", categories)
    
    gravity = [(1, "Heinous"), (2, "Non-Heinous")]
    cursor.executemany("INSERT INTO GravityOffence VALUES (?, ?);", gravity)
    
    crime_heads = [
        (1, "Crimes Against Body", 1),
        (2, "Crimes Against Property", 1),
        (3, "Cyber Crime", 1),
        (4, "Financial & White Collar Crime", 1),
    ]
    cursor.executemany("INSERT INTO CrimeHead VALUES (?, ?, ?);", crime_heads)
    
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
    
    status = [
        (1, "Under Investigation"),
        (2, "Charge Sheeted"),
        (3, "Closed - Undetected"),
        (4, "Closed - False Case"),
    ]
    cursor.executemany("INSERT INTO CaseStatusMaster VALUES (?, ?);", status)
    
    courts = [
        (1, "City Civil Court Bengaluru", 1, 1, 1),
        (2, "JMFC Court Mysuru", 2, 1, 1),
        (3, "High Court of Karnataka", 1, 1, 1),
    ]
    cursor.executemany("INSERT INTO Court VALUES (?, ?, ?, ?, ?);", courts)
    
    castes = [(1, "General"), (2, "OBC"), (3, "SC"), (4, "ST")]
    cursor.executemany("INSERT INTO CasteMaster VALUES (?, ?);", castes)
    
    religions = [(1, "Hindu"), (2, "Muslim"), (3, "Christian"), (4, "Sikh")]
    cursor.executemany("INSERT INTO ReligionMaster VALUES (?, ?);", religions)
    
    occupations = [
        (1, "Farmer"), (2, "Software Engineer"), (3, "Business Owner"), 
        (4, "Laborer"), (5, "Unemployed"), (6, "Student")
    ]
    cursor.executemany("INSERT INTO OccupationMaster VALUES (?, ?);", occupations)

    acts = [
        ("IPC", "Indian Penal Code", "IPC", 1),
        ("NDPS", "Narcotic Drugs and Psychotropic Substances Act", "NDPS", 1),
        ("IT_ACT", "Information Technology Act", "IT Act", 1),
    ]
    cursor.executemany("INSERT INTO Act VALUES (?, ?, ?, ?);", acts)

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

    # 19. CaseMaster Records (Let's generate 8 manual and 49,992 synthetic cases = 50,000 cases total)
    cases = [
        # Case 1: Cyber Fraud in Koramangala, Bengaluru (Accused: Rajesh Gowda)
        (
            1, "104430006202600001", "202600001", "2026-02-10", 1001, 101, 1, 2, 3, 6, 1, 1,
            "2026-02-09 14:30:00", "2026-02-09 16:00:00", "2026-02-10 10:00:00",
            12.9352, 77.6244, # Koramangala
            "The complainant stated that they received a WhatsApp message with a phishing link pretending to be from Bengaluru Electricity Supply Company (BESCOM) threatening power disconnection. Upon clicking, Rs. 1,50,000 was debited from their bank account in three transfers. [District: Bengaluru City]"
        ),
        # Case 2: House Breaking / Robbery in Indiranagar, Bengaluru (Accused: Rajesh Gowda & Suresh Hegde)
        (
            2, "104430006202600002", "202600002", "2026-03-01", 1002, 102, 1, 1, 2, 4, 1, 1,
            "2026-02-28 23:00:00", "2026-03-01 04:00:00", "2026-03-01 08:00:00",
            12.9784, 77.6408, # Indiranagar
            "Unidentified thieves broke into the locked residence in Indiranagar by breaking the terrace door lock. They stole gold jewelry worth Rs. 5,00,000 and two laptops. Suspect vehicle captured on CCTV matched a black hatchback. [District: Bengaluru City]"
        ),
        # Case 3: Cyber Fraud in Electronic City, Bengaluru (Accused: Suresh Hegde & Vikram Malhotra)
        (
            3, "104430006202600003", "202600003", "2026-04-15", 1003, 103, 1, 2, 3, 5, 1, 1,
            "2026-04-14 10:00:00", "2026-04-14 11:30:00", "2026-04-15 09:00:00",
            12.8452, 77.6632, # Electronic City
            "Identity theft case where suspect cloned the complainant's SIM card and accessed net banking details to steal Rs. 4,00,000. Funds were funneled into multiple suspect mule bank accounts. [District: Bengaluru City]"
        ),
        # Case 4: Robbery/Attempted Murder in Lashkar, Mysuru (Accused: Vikram Malhotra)
        (
            4, "104430006202600004", "202600004", "2026-05-20", 2002, 202, 1, 1, 1, 2, 2, 2,
            "2026-05-19 21:30:00", "2026-05-19 22:00:00", "2026-05-20 06:00:00",
            12.3162, 76.6575, # Lashkar, Mysuru
            "Suspect attacked a shopkeeper with a sharp weapon when he resisted a robbery attempt. Suspect stole cash box containing Rs. 85,000 and fled. Accused Vikram Malhotra arrested on matching descriptions. [District: Mysuru City]"
        ),
        # Case 5: Phishing Fraud in Whitefield, Bengaluru (Accused: Suresh Hegde & Arjun Mehta)
        (
            5, "104430006202600005", "202600005", "2026-05-25", 1001, 101, 1, 2, 3, 5, 1, 1,
            "2026-05-24 11:00:00", "2026-05-24 13:00:00", "2026-05-25 09:30:00",
            12.9698, 77.7499, # Whitefield
            "A corporate executive fell victim to an executive spear-phishing attack. Rs. 2,00,000 was transferred to dummy corporate bank accounts. IP addresses traced back to a local proxy node. [District: Bengaluru City]"
        ),
        # Case 6: Attempted Murder in Jayanagar, Bengaluru (Accused: Rajesh Gowda & Farhan Akhtar)
        (
            6, "104430006202600006", "202600006", "2026-06-05", 1002, 102, 1, 1, 1, 2, 1, 1,
            "2026-06-04 22:30:00", "2026-06-04 23:30:00", "2026-06-05 08:00:00",
            12.9299, 77.5824, # Jayanagar
            "Victim assaulted near Jayanagar 4th Block metro station by two gang members riding a black motorcycle. Weapon recovered at the crime scene. Rajesh Gowda and Farhan Akhtar named as primary suspects. [District: Bengaluru City]"
        ),
        # Case 7: Online Financial Fraud in Hebbal, Bengaluru (Accused: Arjun Mehta & Karan Johar)
        (
            7, "104430006202600007", "202600007", "2026-06-18", 1003, 103, 1, 2, 3, 6, 1, 1,
            "2026-06-17 15:30:00", "2026-06-17 18:00:00", "2026-06-18 10:00:00",
            13.0354, 77.5988, # Hebbal
            "Complainant reported credit card details cloned and used for purchasing high-end electronics worth Rs. 1,20,000 online. Deliveries matched addresses linked to accomplice Karan Johar. [District: Bengaluru City]"
        ),
        # Case 8: Robbery in Gokulam, Mysuru (Accused: Vikram Malhotra & Farhan Akhtar)
        (
            8, "104430006202600008", "202600008", "2026-07-02", 2002, 202, 1, 1, 2, 3, 2, 2,
            "2026-07-01 20:00:00", "2026-07-01 21:00:00", "2026-07-02 09:00:00",
            12.3278, 76.6214, # Gokulam, Mysuru
            "Two suspects broke into a convenience store during closing hours and stole Rs. 95,000 in cash. Fingerprints matched Vikram Malhotra, who was seen fleeing the area with Farhan Akhtar. [District: Mysuru City]"
        )
    ]

    # 20. Complainants
    complainants = [
        (1, 1, "Kiran Gowda", 34, 2, 1, 1, 1),
        (2, 2, "Shubha Murthy", 56, 3, 1, 1, 2),
        (3, 3, "Mohammed Yusuf", 42, 2, 2, 2, 1),
        (4, 4, "Venkatesh Rao", 61, 3, 1, 1, 1),
        (5, 5, "Nisha Sharma", 29, 2, 1, 1, 1),
        (6, 6, "Praveen Kumar", 45, 3, 1, 1, 1),
        (7, 7, "Asha Shenoy", 38, 2, 2, 2, 1),
        (8, 8, "Siddharth Hegde", 50, 3, 1, 1, 1),
    ]

    # 21. Victims
    victims = [
        (1, 1, "Kiran Gowda", 34, 1, "0"),
        (2, 2, "Shubha Murthy", 56, 2, "0"),
        (3, 3, "Mohammed Yusuf", 42, 1, "0"),
        (4, 4, "Venkatesh Rao", 61, 1, "0"),
        (5, 5, "Nisha Sharma", 29, 1, "0"),
        (6, 6, "Praveen Kumar", 45, 1, "0"),
        (7, 7, "Asha Shenoy", 38, 1, "0"),
        (8, 8, "Siddharth Hegde", 50, 1, "0"),
    ]

    # 22. Accused
    accused_list = [
        (1, 1, "Rajesh Gowda", 29, 1, "A1"),
        (2, 2, "Rajesh Gowda", 29, 1, "A1"),
        (3, 2, "Suresh Hegde", 31, 1, "A2"),
        (4, 3, "Suresh Hegde", 31, 1, "A1"),
        (5, 3, "Vikram Malhotra", 27, 1, "A2"),
        (6, 4, "Vikram Malhotra", 27, 1, "A1"),
        (7, 5, "Suresh Hegde", 31, 1, "A1"),
        (8, 5, "Arjun Mehta", 34, 1, "A2"),
        (9, 6, "Rajesh Gowda", 29, 1, "A1"),
        (10, 6, "Farhan Akhtar", 28, 1, "A2"),
        (11, 7, "Arjun Mehta", 34, 1, "A1"),
        (12, 7, "Karan Johar", 32, 1, "A2"),
        (13, 8, "Vikram Malhotra", 27, 1, "A1"),
        (14, 8, "Farhan Akhtar", 28, 1, "A2"),
    ]

    # Dynamic synthetic case generator (reach 5,000 cases total)
    print("Generating 4,992 synthetic case files dynamically...")
    facts_templates = [
        "Online banking scam. Complainant lost funds via phishing redirect link.",
        "Theft of gold ornaments from residential building during daytime.",
        "Physical altercation and minor injuries near local metro transit station.",
        "Attempted robbery during night hours at convenience store. Suspect fled.",
        "Attempt to murder over personal rivalry. Victim admitted to district hospital.",
        "SIM card duplication fraud. Complainant reported card deactivated unexpectedly.",
        "Credit card skimming case where duplicate card was used for online purchases.",
        "Corporate database breach and ransomware demand. IP traced back to local node."
    ]
    
    suspect_pool = [
        "Suresh Hegde", "Rajesh Gowda", "Vikram Malhotra", "Arjun Mehta", "Farhan Akhtar",
        "Karan Johar", "Ramesh Kumar", "Amit Sharma", "Vijay Patil", "Sunil Devadiga",
        "Anand Rao", "Siddharth Kulkarni", "Pranav Desai", "Harish Nayak", "Chetan Reddy"
    ]

    first_names = [
        "Rajesh", "Suresh", "Vikram", "Arjun", "Farhan", "Karan", "Ramesh", "Amit", "Vijay", "Sunil",
        "Anand", "Siddharth", "Pranav", "Harish", "Chetan", "Sandip", "Prakash", "Girish", "Manjunath", "Raghu",
        "Shivaji", "Bheem", "Ganesh", "Mahesh", "Naveen", "Pramod", "Kiran", "Karthik", "Sanjay", "Vinay",
        "Lokesh", "Deepak", "Sharath", "Abhishek", "Manoj", "Pradeep", "Raghav", "Satish", "Mohan", "Umesh"
    ]
    last_names = [
        "Hegde", "Gowda", "Malhotra", "Mehta", "Akhtar", "Johar", "Kumar", "Sharma", "Patil", "Devadiga",
        "Rao", "Kulkarni", "Desai", "Nayak", "Reddy", "Shetty", "Bhat", "Joshi", "Naidu", "Prasad",
        "Sawant", "Pawar", "Shinde", "More", "Kadam", "Jadhav", "Menezes", "D'Souza", "Pinto", "Fernandes",
        "Acharya", "Shenoy", "Kamath", "Pai", "Mallya", "Venkatesh", "Krishnan", "Iyer", "Nair", "Pillai"
    ]

    # Map station IDs to coordinate centers for clustering (All 12 major districts)
    station_centers = {
        101: (12.9352, 77.6244, "Bengaluru City"), # Koramangala
        102: (12.9784, 77.6408, "Bengaluru City"), # Indiranagar
        103: (12.8452, 77.6632, "Bengaluru City"), # Electronic City
        201: (12.3022, 76.6492, "Mysuru City"),
        202: (12.3162, 76.6575, "Mysuru City"),
        301: (15.3647, 75.1240, "Hubballi-Dharwad City"),
        401: (12.9141, 74.8560, "Mangaluru City"),
        501: (15.8497, 74.4977, "Belagavi"),
        601: (13.3409, 74.7421, "Udupi"),
        701: (13.9299, 75.5681, "Shivamogga"),
        801: (17.3297, 76.8343, "Kalaburagi"),
        901: (14.4644, 75.9218, "Davanagere"),
        1001: (13.3392, 77.1011, "Tumakuru"),
        1101: (16.8302, 75.7100, "Vijayapura"),
        1201: (15.1394, 76.9214, "Ballari")
    }

    random.seed(42)
    accused_id_counter = 15

    for i in range(9, 5001):
        crime_no = f"1044300062026{str(i).zfill(6)}"
        case_no = f"2026{str(i).zfill(6)}"
        
        days_offset = random.randint(0, 500)
        incident_date = datetime(2025, 1, 1) + timedelta(days=days_offset)
        date_str = incident_date.strftime("%Y-%m-%d")
        incident_time_from = incident_date.strftime("%Y-%m-%d %H:%M:%S")
        incident_time_to = (incident_date + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
        received_time = (incident_date + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        
        officer = random.choice([1001, 1002, 1003, 2002])
        station = random.choice(list(station_centers.keys()))
        
        # Coordinate clustering around designated station centers
        lat_c, lng_c, dist_name = station_centers[station]
        lat = lat_c + random.uniform(-0.06, 0.06)
        lng = lng_c + random.uniform(-0.06, 0.06)
        
        # Spelling variations (Bangalore / Bengaluru)
        if dist_name == "Bengaluru City":
            facts_tag = " Bangalore City precinct incident." if random.random() > 0.5 else " Bengaluru SCRB district report."
        else:
            facts_tag = f" {dist_name} precinct incident."
            
        facts = random.choice(facts_templates) + facts_tag
        gravity_id = random.choice([1, 2])
        major_head = random.choice([1, 2, 3, 4])
        
        if major_head == 1: minor_head = random.choice([1, 2])
        elif major_head == 2: minor_head = random.choice([3, 4])
        elif major_head == 3: minor_head = random.choice([5, 6])
        else: minor_head = 7
        
        status_id = random.choice([1, 2, 3, 4])
        court_id = random.choice([1, 2, 3])
        
        cases.append((
            i, crime_no, case_no, date_str, officer, station,
            1, gravity_id, major_head, minor_head, status_id, court_id,
            incident_time_from, incident_time_to, received_time,
            lat, lng, facts
        ))
        
        complainants.append((i, i, f"Citizen-{i}", 20 + (i % 60), 1, 1, 1, 1))
        victims.append((i, i, f"Citizen-{i}", 20 + (i % 60), 1, "0"))
        
        # Accused links (about 25% of cases linked to repeat suspect pool)
        if i % 4 == 0:
            if i % 12 == 0:
                suspect_name = random.choice(suspect_pool)
            else:
                suspect_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            suspect_age = 22 + (i % 35)
            accused_list.append((
                accused_id_counter, i, suspect_name, suspect_age, 1, "A1"
            ))
            accused_id_counter += 1
            
            # Double accused accomplices (5% of cases)
            if i % 20 == 0:
                if i % 60 == 0:
                    other_suspect = random.choice([s for s in suspect_pool if s != suspect_name])
                else:
                    other_suspect = f"{random.choice(first_names)} {random.choice(last_names)}"
                accused_list.append((
                    accused_id_counter, i, other_suspect, 22 + ((i+1) % 35), 1, "A2"
                ))
                accused_id_counter += 1

    # Bulk execute CaseMaster inserts
    print("Writing 50,000 cases to database...")
    cursor.executemany("""
    INSERT INTO CaseMaster (
        CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, 
        CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, 
        IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, cases)

    # Bulk execute Complainants and Victims
    print("Writing complainants & victims to database...")
    cursor.executemany("INSERT INTO ComplainantDetails VALUES (?, ?, ?, ?, ?, ?, ?, ?);", complainants)
    cursor.executemany("INSERT INTO Victim VALUES (?, ?, ?, ?, ?, ?);", victims)

    # Bulk execute Accused
    print("Writing accused list to database...")
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
        (5, "IT_ACT", "66D", 1, 1),
        (6, "IPC", "307", 1, 1),
        (7, "IPC", "420", 1, 1),
        (8, "IPC", "392", 1, 1),
    ]
    cursor.executemany("INSERT INTO ActSectionAssociation VALUES (?, ?, ?, ?, ?);", associations)

    # 24. Arrest Details
    arrests = [
        (1, 4, 1, "2026-05-21", 1, 2, 202, 2002, 2, 6, 1, 0),
        (2, 2, 1, "2026-03-05", 1, 1, 102, 1002, 1, 3, 0, 0),
    ]
    cursor.executemany("INSERT INTO ArrestSurrender VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", arrests)

    # 25. Financial Transactions (Money trails linking cyber fraud to bank accounts)
    transactions = [
        (1, 1, 1, "ACC-KIRAN-889", "ACC-MULE-772", 50000.00, "2026-02-09 14:45:00", 1),
        (2, 1, 1, "ACC-KIRAN-889", "ACC-MULE-664", 50000.00, "2026-02-09 14:50:00", 1),
        (3, 1, 1, "ACC-KIRAN-889", "ACC-MULE-112", 50000.00, "2026-02-09 15:00:00", 1),
        (4, 1, 2, "ACC-MULE-772", "ACC-SURESH-901", 45000.00, "2026-02-09 16:30:00", 1),
        (5, 1, 2, "ACC-MULE-664", "ACC-SURESH-901", 45000.00, "2026-02-09 16:35:00", 1),
        (6, 3, 4, "ACC-VICTIM-991", "ACC-MULE-112", 200000.00, "2026-04-14 10:15:00", 1),
        (7, 3, 5, "ACC-MULE-112", "ACC-VIKRAM-442", 150000.00, "2026-04-14 12:00:00", 1),
        (8, 5, 8, "ACC-VICTIM-NISH", "ACC-MULE-881", 100000.00, "2026-05-24 11:30:00", 1),
        (9, 5, 8, "ACC-VICTIM-NISH", "ACC-MULE-881", 100000.00, "2026-05-24 11:45:00", 1),
        (10, 5, 8, "ACC-MULE-881", "ACC-SURESH-901", 90000.00, "2026-05-24 12:30:00", 1),
        (11, 5, 8, "ACC-MULE-881", "ACC-ARJUN-501", 90000.00, "2026-05-24 12:45:00", 1),
    ]
    cursor.executemany("INSERT INTO FinancialTransactions VALUES (?, ?, ?, ?, ?, ?, ?, ?);", transactions)

    # 26. Create Performance Indexes for rapid querying on 50,000 cases
    print("Creating index structures...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cm_registered ON CaseMaster(CrimeRegisteredDate);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_cm_station ON CaseMaster(PoliceStationID);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_accused_case ON Accused(CaseMasterID);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_accused_name ON Accused(AccusedName);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_victim_case ON Victim(CaseMasterID);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ft_case ON FinancialTransactions(CaseMasterID);")

    conn.commit()
    conn.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    # Ensure database directory exists
    os.makedirs(DB_DIR, exist_ok=True)
    init_database()
