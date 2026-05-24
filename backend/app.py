from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import pandas as pd
import os

from datetime import datetime

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

if not os.path.exists(progress_file):

    progress_df = pd.DataFrame(columns=[
        "Bp Number farms",
        "Status",
        "Completed_Time"
    ])

    progress_df.to_csv(progress_file, index=False)

# ---------------------------------------------------
# GET DATES
# ---------------------------------------------------

@app.get("/days")
def get_days():

    # Convert to datetime for proper sorting
    farmers_df['Date'] = pd.to_datetime(
        farmers_df['Date'],
        errors='coerce'
    )

    # Sort dates properly
    sorted_dates = farmers_df['Date'] \
        .dropna() \
        .sort_values() \
        .dt.strftime('%d-%m-%Y') \
        .unique() \
        .tolist()

    return sorted_dates

# ---------------------------------------------------
# GET TEAMS
# ---------------------------------------------------

@app.get("/teams/{day}")
def get_teams(day: str):

    # Convert incoming string to datetime
    selected_date = pd.to_datetime(
        day,
        format='%d-%m-%Y',
        errors='coerce'
    )

    filtered = farmers_df[
        farmers_df['Date'] == selected_date
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

@app.get("/villages/{day}/{team}")
def get_villages(day: str, team: str):

    selected_date = pd.to_datetime(
        day,
        format='%d-%m-%Y',
        errors='coerce'
    )

    filtered = farmers_df[
        (farmers_df['Date'] == selected_date)
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

    selected_date = pd.to_datetime(
        day,
        format='%d-%m-%Y',
        errors='coerce'
    )

    filtered = farmers_df[
        (farmers_df['Date'] == selected_date)
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
        (routes_df['Date'].astype(str) == str(day))
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

    progress_df = pd.read_csv(progress_file)

    current_time = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    progress_df = progress_df[
        progress_df['Bp Number farms']
        !=
        bp_number
    ]

    new_row = pd.DataFrame([{
        "Bp Number farms": bp_number,
        "Status": "Completed",
        "Completed_Time": current_time
    }])

    progress_df = pd.concat(
        [progress_df, new_row],
        ignore_index=True
    )

    progress_df.to_csv(
        progress_file,
        index=False
    )

    return {
        "message": "Farmer marked completed"
    }

# ---------------------------------------------------
# UNDO COMPLETE
# ---------------------------------------------------

@app.post("/undo/{bp_number}")
def undo_complete(bp_number: str):

    progress_df = pd.read_csv(progress_file)

    progress_df = progress_df[
        progress_df['Bp Number farms']
        !=
        bp_number
    ]

    progress_df.to_csv(
        progress_file,
        index=False
    )

    return {
        "message": "Completion removed"
    }

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
        subset=['Bp Number farms'],
        keep='last'
    )

    # Merge with all farmer data
    merged = farmers_df.merge(
        progress_df,
        on="Bp Number farms",
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

    if 'Date' in merged.columns:
        sort_columns.append('Date')

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