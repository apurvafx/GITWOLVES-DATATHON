from fastapi import APIRouter, HTTPException, Depends
from backend.routes.auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import sqlite3
import os

router = APIRouter(prefix="/api/cases", tags=["cases"])
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "ksp_crime.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/")
def get_cases(district_id: int = None, user: dict = Depends(get_current_user)):
    # Role-based restriction check: Policymaker gets anonymized or general data, but for hackathon demo we will allow it
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT CM.CaseMasterID, CM.CrimeNo, CM.CaseNo, CM.CrimeRegisteredDate, 
               CH.CrimeGroupName, CSH.CrimeHeadName, CM.latitude, CM.longitude, CM.BriefFacts,
               D.DistrictName, U.UnitName, CS.CaseStatusName
        FROM CaseMaster CM
        JOIN CrimeHead CH ON CM.CrimeMajorHeadID = CH.CrimeHeadID
        JOIN CrimeSubHead CSH ON CM.CrimeMinorHeadID = CSH.CrimeSubHeadID
        JOIN Unit U ON CM.PoliceStationID = U.UnitID
        JOIN District D ON U.DistrictID = D.DistrictID
        JOIN CaseStatusMaster CS ON CM.CaseStatusID = CS.CaseStatusID
    """
    
    params = []
    if district_id:
        query += " WHERE D.DistrictID = ?"
        params.append(district_id)
        
    query += " ORDER BY CM.CrimeRegisteredDate DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    cases = []
    for row in rows:
        case_dict = dict(row)
        # Anonymization for policymaker role (Requirement 10)
        if user.get("role") == "Policymaker":
            case_dict["BriefFacts"] = "[Confidential Facts Anonymized]"
        cases.append(case_dict)
        
    conn.close()
    return cases

@router.get("/map/coordinates")
def get_map_coordinates(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT CM.CaseMasterID, CM.CrimeNo, CM.latitude, CM.longitude, 
               CH.CrimeGroupName, CSH.CrimeHeadName, CM.BriefFacts
        FROM CaseMaster CM
        JOIN CrimeHead CH ON CM.CrimeMajorHeadID = CH.CrimeHeadID
        JOIN CrimeSubHead CSH ON CM.CrimeMinorHeadID = CSH.CrimeSubHeadID
    """)
    rows = cursor.fetchall()
    conn.close()
    
    coordinates = []
    for row in rows:
        row_dict = dict(row)
        if user.get("role") == "Policymaker":
            row_dict["BriefFacts"] = "[Confidential]"
        coordinates.append(row_dict)
    return coordinates

@router.get("/network/graph")
def get_network_graph(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    # 1. Fetch latest 40 cases that have accused suspects to keep R3F viewport responsive
    cursor.execute("""
        SELECT CaseMasterID, CrimeNo, CrimeRegisteredDate 
        FROM CaseMaster
        WHERE CaseMasterID IN (SELECT DISTINCT CaseMasterID FROM Accused)
        ORDER BY CrimeRegisteredDate DESC
        LIMIT 40
    """)
    case_rows = cursor.fetchall()
    case_ids = [row["CaseMasterID"] for row in case_rows]
    
    if not case_ids:
        case_ids = [1, 2, 3, 4, 5, 6, 7, 8]
        cursor.execute(f"SELECT CaseMasterID, CrimeNo, CrimeRegisteredDate FROM CaseMaster WHERE CaseMasterID IN ({','.join(['?']*len(case_ids))})", case_ids)
        case_rows = cursor.fetchall()
        
    placeholders = ",".join(["?"] * len(case_ids))
    
    # 2. Fetch Accused linked to these cases
    cursor.execute(f"""
        SELECT AccusedMasterID, AccusedName, CaseMasterID, PersonID 
        FROM Accused
        WHERE CaseMasterID IN ({placeholders})
    """, case_ids)
    accused_rows = cursor.fetchall()
    
    # 3. Fetch Victims linked to these cases
    cursor.execute(f"""
        SELECT VictimMasterID, VictimName, CaseMasterID 
        FROM Victim
        WHERE CaseMasterID IN ({placeholders})
    """, case_ids)
    victim_rows = cursor.fetchall()
    
    # 4. Fetch Financial Transactions linked to these cases
    cursor.execute(f"""
        SELECT TransactionID, CaseMasterID, SourceAccount, DestinationAccount, Amount 
        FROM FinancialTransactions
        WHERE CaseMasterID IN ({placeholders})
    """, case_ids)
    tx_rows = cursor.fetchall()
    
    conn.close()
    
    nodes = []
    edges = []
    
    # We will build nodes for Cases, Accused, and Victims
    added_nodes = set()
    
    # Add Cases
    for row in case_rows:
        case_id = f"case_{row['CaseMasterID']}"
        nodes.append({
            "id": case_id,
            "label": f"FIR: {row['CrimeNo']}",
            "type": "case",
            "date": row["CrimeRegisteredDate"]
        })
        added_nodes.add(case_id)
        
    # Add Accused and link to Case
    for row in accused_rows:
        acc_id = f"acc_{row['AccusedName'].replace(' ', '_').lower()}"
        if acc_id not in added_nodes:
            nodes.append({
                "id": acc_id,
                "label": row["AccusedName"],
                "type": "accused"
            })
            added_nodes.add(acc_id)
            
        edges.append({
            "source": acc_id,
            "target": f"case_{row['CaseMasterID']}",
            "label": row["PersonID"] or "Accused",
            "type": "charge"
        })
        
    # Add Victims and link to Case
    for row in victim_rows:
        # Policymakers shouldn't see victim names for privacy
        label = "Victim (Anonymized)" if user.get("role") == "Policymaker" else row["VictimName"]
        vic_id = f"vic_{row['VictimMasterID']}"
        nodes.append({
            "id": vic_id,
            "label": label,
            "type": "victim"
        })
        edges.append({
            "source": vic_id,
            "target": f"case_{row['CaseMasterID']}",
            "label": "Victimized",
            "type": "victim_link"
        })

    # Add Accounts and Money Trails (Requirement 7)
    for row in tx_rows:
        src_id = f"acct_{row['SourceAccount']}"
        dst_id = f"acct_{row['DestinationAccount']}"
        
        if src_id not in added_nodes:
            nodes.append({"id": src_id, "label": row["SourceAccount"], "type": "account"})
            added_nodes.add(src_id)
        if dst_id not in added_nodes:
            nodes.append({"id": dst_id, "label": row["DestinationAccount"], "type": "account"})
            added_nodes.add(dst_id)
            
        edges.append({
            "source": src_id,
            "target": dst_id,
            "label": f"Rs. {row['Amount']:,}",
            "type": "transaction",
            "case_id": f"case_{row['CaseMasterID']}"
        })
        
    return {"nodes": nodes, "edges": edges}

@router.get("/offenders")
def get_offenders(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query distinct offender names and link their cases
    cursor.execute("""
        SELECT AccusedName, COUNT(DISTINCT CaseMasterID) as CaseCount, GROUP_CONCAT(DISTINCT CaseMasterID) as CaseIDs
        FROM Accused
        GROUP BY AccusedName
    """)
    rows = cursor.fetchall()
    
    offenders = []
    for row in rows:
        name = row["AccusedName"]
        case_count = row["CaseCount"]
        case_ids = [int(cid) for cid in row["CaseIDs"].split(",") if cid]
        
        # Calculate dynamic threat score (Requirement 5)
        # Severity calculation based on Heinous (weight=25) vs Non-Heinous (weight=10)
        cursor.execute(f"""
            SELECT COUNT(*) 
            FROM CaseMaster 
            WHERE CaseMasterID IN ({','.join(['?']*len(case_ids))}) AND GravityOffenceID = 1
        """, case_ids)
        heinous_count = cursor.fetchone()[0]
        
        # Threat score = (Cases Count * 15) + (Heinous count * 20) + (Accomplices Count * 5)
        cursor.execute(f"""
            SELECT COUNT(DISTINCT AccusedName) - 1 
            FROM Accused 
            WHERE CaseMasterID IN ({','.join(['?']*len(case_ids))})
        """, case_ids)
        accomplice_count = cursor.fetchone()[0]
        
        threat_score = min(100, (case_count * 15) + (heinous_count * 20) + (accomplice_count * 5))
        
        offenders.append({
            "name": name,
            "case_count": case_count,
            "threat_score": threat_score,
            "risk_level": "High" if threat_score >= 60 else ("Medium" if threat_score >= 30 else "Low")
        })
        
    conn.close()
    return offenders

@router.get("/{case_id}")
def get_case_details(case_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch main case
    cursor.execute("""
        SELECT CM.*, CH.CrimeGroupName, CSH.CrimeHeadName, D.DistrictName, U.UnitName, CS.CaseStatusName, E.FirstName as OfficerName
        FROM CaseMaster CM
        JOIN CrimeHead CH ON CM.CrimeMajorHeadID = CH.CrimeHeadID
        JOIN CrimeSubHead CSH ON CM.CrimeMinorHeadID = CSH.CrimeSubHeadID
        JOIN Unit U ON CM.PoliceStationID = U.UnitID
        JOIN District D ON U.DistrictID = D.DistrictID
        JOIN CaseStatusMaster CS ON CM.CaseStatusID = CS.CaseStatusID
        JOIN Employee E ON CM.PolicePersonID = E.EmployeeID
        WHERE CM.CaseMasterID = ?
    """, (case_id,))
    case_row = cursor.fetchone()
    if not case_row:
        raise HTTPException(status_code=404, detail="Case not found")
        
    case_dict = dict(case_row)
    if user.get("role") == "Policymaker":
        case_dict["BriefFacts"] = "[Confidential]"
        
    # 2. Fetch Accused
    cursor.execute("SELECT AccusedName, AgeYear, GenderID, PersonID FROM Accused WHERE CaseMasterID = ?", (case_id,))
    case_dict["accused"] = [dict(r) for r in cursor.fetchall()]
    
    # 3. Fetch Victims
    cursor.execute("SELECT VictimName, AgeYear, GenderID, VictimPolice FROM Victim WHERE CaseMasterID = ?", (case_id,))
    victims = []
    for r in cursor.fetchall():
        vic_dict = dict(r)
        if user.get("role") == "Policymaker":
            vic_dict["VictimName"] = "Anonymized"
        victims.append(vic_dict)
    case_dict["victims"] = victims
    
    # 4. Fetch Complainant
    cursor.execute("SELECT ComplainantName, AgeYear, GenderID FROM ComplainantDetails WHERE CaseMasterID = ?", (case_id,))
    complainant = cursor.fetchone()
    case_dict["complainant"] = dict(complainant) if complainant else None
    
    # 5. Fetch Act/Section
    cursor.execute("""
        SELECT ASA.ActID, ASA.SectionID, S.SectionDescription
        FROM ActSectionAssociation ASA
        JOIN Section S ON ASA.ActID = S.ActCode AND ASA.SectionID = S.SectionCode
        WHERE ASA.CaseMasterID = ?
    """, (case_id,))
    case_dict["legal_sections"] = [dict(r) for r in cursor.fetchall()]
    
    # 6. Fetch Arrest details
    cursor.execute("""
        SELECT AR.ArrestSurrenderDate, AR.ArrestSurrenderTypeID, E.FirstName as IO_Name
        FROM ArrestSurrender AR
        JOIN Employee E ON AR.IOID = E.EmployeeID
        WHERE AR.CaseMasterID = ?
    """, (case_id,))
    case_dict["arrests"] = [dict(r) for r in cursor.fetchall()]
    
    # 7. Fetch financial trails
    cursor.execute("SELECT SourceAccount, DestinationAccount, Amount, TransactionDate, IsSuspicious FROM FinancialTransactions WHERE CaseMasterID = ?", (case_id,))
    case_dict["transactions"] = [dict(r) for r in cursor.fetchall()]

    # 8. Timeline generation (Requirement 6)
    timeline = []
    timeline.append({"event": "Incident Occurred", "date": case_dict["IncidentFromDate"], "desc": "Crime occurred."})
    timeline.append({"event": "FIR Registered", "date": case_dict["CrimeRegisteredDate"], "desc": f"FIR registered at {case_dict['UnitName']}."})
    for arrest in case_dict["arrests"]:
        type_str = "Arrested" if arrest["ArrestSurrenderTypeID"] == 1 else "Surrendered"
        timeline.append({"event": f"Accused {type_str}", "date": arrest["ArrestSurrenderDate"], "desc": f"Handled by IO {arrest['IO_Name']}."})
    
    # Sort timeline by date
    timeline.sort(key=lambda x: x["date"] or "")
    case_dict["timeline"] = timeline
    
    conn.close()
    return case_dict

class CaseRegisterPayload(BaseModel):
    crime_no: str
    case_no: str
    crime_date: str
    station_id: int
    major_head_id: int
    minor_head_id: int
    gravity_id: int
    status_id: int
    court_id: int
    lat: float
    lng: float
    facts: str
    accused_name: Optional[str] = None
    accused_age: Optional[int] = None
    accused_role: Optional[str] = None

@router.post("/register")
def register_case(payload: CaseRegisterPayload, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Insert CaseMaster record
        cursor.execute("""
            INSERT INTO CaseMaster (
                CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, 
                CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, 
                IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            payload.crime_no, payload.case_no, payload.crime_date, 1001, payload.station_id,
            1, payload.gravity_id, payload.major_head_id, payload.minor_head_id, payload.status_id, payload.court_id,
            payload.crime_date + " 00:00:00", payload.crime_date + " 00:00:00", payload.crime_date + " 00:00:00",
            payload.lat, payload.lng, payload.facts
        ))
        case_master_id = cursor.lastrowid
        
        # If accused details provided, insert into Accused
        if payload.accused_name:
            cursor.execute("""
                INSERT INTO Accused (CaseMasterID, AccusedName, AgeYear, GenderID, PersonID)
                VALUES (?, ?, ?, ?, ?)
            """, (case_master_id, payload.accused_name, payload.accused_age or 30, 1, payload.accused_role or "A1"))
            
        conn.commit()
        return {"status": "success", "case_master_id": case_master_id}
    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e)}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        conn.close()
