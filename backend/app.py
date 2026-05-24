from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import pandas as pd
import os

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
with engine.begin() as conn:

    conn.execute(text("""

        CREATE TABLE IF NOT EXISTS completed_farmers (

            bp_number TEXT PRIMARY KEY

        )

    """))

# ---------------------------------------------------
# APP
# ---------------------------------------------------

app = FastAPI()
@app.get("/")
def home():

    return {
        "message": "Farm Backend Running Successfully"
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# FILES
# ---------------------------------------------------

farmers_file = "data/Final_Field_Plan.xlsx"

routes_file = "data/Final_Routes.xlsx"

progress_file = "progress.csv"

# ---------------------------------------------------
# LOAD DATA
# ---------------------------------------------------

farmers_df = pd.read_excel(farmers_file)

routes_df = pd.read_excel(routes_file)

farmers_df = farmers_df.fillna("")

routes_df = routes_df.fillna("")

# ---------------------------------------------------
# CREATE PROGRESS FILE
# ---------------------------------------------------

@app.get("/progress")
def get_progress():

    with engine.begin() as conn:

        result = conn.execute(text("""

            SELECT bp_number
            FROM completed_farmers

        """))

        completed = [

            {"Bp Number": row[0]}

            for row in result.fetchall()
        ]

    return completed

# ---------------------------------------------------
# GET TEAMS
# ---------------------------------------------------

@app.get("/teams/{day}")
def get_teams(day: str):

    filtered = farmers_df[
        farmers_df['Day'].astype(str) == str(day)
    ]

    teams = sorted(
        filtered['Team']
        .astype(str)
        .unique()
        .tolist()
    )

    return teams

# ---------------------------------------------------
# GET VILLAGES
# ---------------------------------------------------

# ---------------------------------------------------
# GET VILLAGES
# ---------------------------------------------------

@app.get("/villages/{day}/{team}")
def get_villages(day: str, team: str):

    filtered = farmers_df[
        (farmers_df['Day'].astype(str) == str(day))
        &
        (farmers_df['Team'].astype(str) == str(team))
    ]

    villages = sorted(
        filtered['village']
        .astype(str)
        .unique()
        .tolist()
    )

    return villages

# ---------------------------------------------------
# GET FARMERS
# ---------------------------------------------------

@app.get("/farmers/{day}/{team}")
def get_farmers(day: str, team: str):

    filtered = farmers_df[
        (farmers_df['Day'].astype(str) == str(day))
        &
        (farmers_df['Team'].astype(str) == str(team))
    ]

    return filtered.to_dict(
        orient='records'
    )

# ---------------------------------------------------
# GET ROUTE
# ---------------------------------------------------

@app.get("/route/{day}/{team}")
def get_route(day: str, team: str):

    filtered = routes_df[
        (routes_df['Day'].astype(str) == str(day))
        &
        (routes_df['Team'].astype(str) == str(team))
    ]

    if len(filtered) == 0:

        return {}

    return filtered.iloc[0].to_dict()

# ---------------------------------------------------
# COMPLETE FARMER
# ---------------------------------------------------

@app.post("/complete/{bp_number}")
def complete_farmer(bp_number: str):

    with engine.begin() as conn:

        conn.execute(text("""

            INSERT INTO completed_farmers (bp_number)

            VALUES (:bp)

            ON CONFLICT (bp_number)

            DO NOTHING

        """), {"bp": bp_number})

    return {"status": "success"}

# ---------------------------------------------------
# UNDO COMPLETE
# ---------------------------------------------------

@app.post("/undo/{bp_number}")
def undo_farmer(bp_number: str):

    with engine.begin() as conn:

        conn.execute(text("""

            DELETE FROM completed_farmers

            WHERE bp_number = :bp

        """), {"bp": bp_number})

    return {"status": "success"}

# ---------------------------------------------------
# GET PROGRESS
# ---------------------------------------------------

@app.get("/progress")
def get_progress():

    progress_df = pd.read_csv(progress_file)

    return progress_df.to_dict(
        orient='records'
    )

# ---------------------------------------------------
# DOWNLOAD REPORT
# ---------------------------------------------------

@app.get("/download-report")
def download_report():

    progress_df = pd.read_csv(progress_file)

    # Remove duplicates if any
    progress_df = progress_df.drop_duplicates(
        subset=['Bp Number'],
        keep='last'
    )

    # Merge with all farmer data
    merged = farmers_df.merge(
        progress_df,
        on="Bp Number",
        how="left"
    )

    # Fill pending status
    merged['Status'] = merged['Status'].fillna(
        "Pending"
    )

    merged['Completed_Time'] = merged[
        'Completed_Time'
    ].fillna("")

    # Sort report
    sort_columns = []

    if 'Day' in merged.columns:
        sort_columns.append('Day')

    if 'Team' in merged.columns:
        sort_columns.append('Team')

    if 'village' in merged.columns:
        sort_columns.append('village')

    if len(sort_columns) > 0:

        merged = merged.sort_values(
            by=sort_columns
        )

    # Output file
    output_file = "Daily_Progress_Report.xlsx"

    # Save Excel
    merged.to_excel(
        output_file,
        index=False
    )

    return FileResponse(
        output_file,
        filename=output_file
    )