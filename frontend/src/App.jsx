import { useEffect, useState } from 'react'
import axios from 'axios'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// ---------------------------------------------------
// FIX LEAFLET ICONS
// ---------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// ---------------------------------------------------
// AUTO ZOOM
// ---------------------------------------------------

function ZoomToFarmers({ farmers }) {

  const map = useMap()

  useEffect(() => {

    if (!farmers || farmers.length === 0) return

    const bounds = farmers
      .filter(f => f.Lat && f.Long)
      .map(farmer => [
        parseFloat(farmer.Lat),
        parseFloat(farmer.Long)
      ])

    if (bounds.length > 0) {

      map.fitBounds(bounds, {
        padding: [50, 50]
      })

    }

  }, [farmers, map])

  return null
}

// ---------------------------------------------------
// FIX MAP RESIZE
// ---------------------------------------------------

function FixMapResize() {

  const map = useMap()

  useEffect(() => {

    setTimeout(() => {
      map.invalidateSize()
    }, 500)

  }, [map])

  return null
}

// ---------------------------------------------------
// MAIN APP
// ---------------------------------------------------

function App() {

  const [days, setDays] = useState([])
  const [teams, setTeams] = useState([])

  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  const [farmers, setFarmers] = useState([])
  const [route, setRoute] = useState(null)

  const [completedFarmers, setCompletedFarmers] = useState([])

  const [showMap, setShowMap] = useState(false)

  const [expandedFarmer, setExpandedFarmer] = useState(null)

  const [comments, setComments] = useState({})

  // ---------------------------------------------------
  // NEW STATES
  // ---------------------------------------------------

  const [activePage, setActivePage] =
    useState('dashboard')

  const [searchQuery, setSearchQuery] =
    useState('')

  const [searchResults, setSearchResults] =
    useState([])

  const [teamPerformance, setTeamPerformance] =
    useState([])

  // ---------------------------------------------------
  // LOAD DAYS
  // ---------------------------------------------------

  useEffect(() => {

    axios.get(
      'https://farm-webapp-6ew5.onrender.com/days'
    )
      .then(res => setDays(res.data))
      .catch(err => console.log(err))

  }, [])

  // ---------------------------------------------------
  // LOAD TEAMS
  // ---------------------------------------------------

  useEffect(() => {

    if (!selectedDay) return

    axios.get(
      `https://farm-webapp-6ew5.onrender.com/teams/${selectedDay}`
    )
      .then(res => setTeams(res.data))
      .catch(err => console.log(err))

  }, [selectedDay])

  // ---------------------------------------------------
  // LOAD FARMERS
  // ---------------------------------------------------

  useEffect(() => {

    if (!selectedDay || !selectedTeam) return

    axios.get(
      `https://farm-webapp-6ew5.onrender.com/farmers/${selectedDay}/${selectedTeam}`
    )
      .then(res => setFarmers(res.data))
      .catch(err => console.log(err))

    axios.get(
      `https://farm-webapp-6ew5.onrender.com/route/${selectedDay}/${selectedTeam}`
    )
      .then(res => setRoute(res.data))
      .catch(err => console.log(err))

  }, [selectedDay, selectedTeam])

  // ---------------------------------------------------
  // SEARCH FARMER
  // ---------------------------------------------------

  const searchFarmer = async () => {

    try {

      const res = await axios.get(

        `https://farm-webapp-6ew5.onrender.com/search/${searchQuery}`

      )

      setSearchResults(res.data)

    } catch (error) {

      console.log(error)

    }
  }

  // ---------------------------------------------------
  // TEAM PERFORMANCE
  // ---------------------------------------------------

  const loadTeamPerformance = async () => {

    try {

      const res = await axios.get(

        'https://farm-webapp-6ew5.onrender.com/team-performance'

      )

      setTeamPerformance(res.data)

    } catch (error) {

      console.log(error)

    }
  }

  // ---------------------------------------------------
  // LOAD PROGRESS
  // ---------------------------------------------------

  const loadProgress = async () => {

    try {

      const res = await axios.get(
        'https://farm-webapp-6ew5.onrender.com/progress'
      )

      const completed = res.data.map(
        item => item['Bp Number']
      )

      setCompletedFarmers(completed)

    } catch (error) {

      console.log(error)

    }

  }

  // ---------------------------------------------------
  // LOAD COMMENTS
  // ---------------------------------------------------

  const loadComments = async () => {

    try {

      const res = await axios.get(
        'https://farm-webapp-6ew5.onrender.com/comments'
      )

      const commentMap = {}

      res.data.forEach(item => {

        commentMap[item['Bp Number']] =
          item['Comment']

      })

      setComments(commentMap)

    } catch (error) {

      console.log(error)

    }
  }

  // ---------------------------------------------------
  // AUTO REFRESH
  // ---------------------------------------------------

  useEffect(() => {

    loadProgress()

    loadComments()

    loadTeamPerformance()

    const interval = setInterval(() => {

      loadProgress()

      loadComments()

      loadTeamPerformance()

      if (selectedDay && selectedTeam) {

        axios.get(
          `https://farm-webapp-6ew5.onrender.com/farmers/${selectedDay}/${selectedTeam}`
        )
          .then(res => setFarmers(res.data))

      }

    }, 3000)

    return () => clearInterval(interval)

  }, [selectedDay, selectedTeam])

  // ---------------------------------------------------
  // SAVE COMMENT
  // ---------------------------------------------------

  const saveComment = async (
    bpNumber,
    comment
  ) => {

    try {

      await axios.post(

        `https://farm-webapp-6ew5.onrender.com/comment/${bpNumber}`,

        {
          comment: comment
        }

      )

      loadComments()

    } catch (error) {

      console.log(error)

    }
  }

  // ---------------------------------------------------
  // COMPLETE FARMER
  // ---------------------------------------------------

  const completeFarmer = async (bpNumber) => {

    try {

      await axios.post(
        `https://farm-webapp-6ew5.onrender.com/complete/${bpNumber}`
      )

      loadProgress()

    } catch (error) {

      console.log(error)

    }

  }

  // ---------------------------------------------------
  // UNDO COMPLETE
  // ---------------------------------------------------

  const undoComplete = async (bpNumber) => {

    try {

      await axios.post(
        `https://farm-webapp-6ew5.onrender.com/undo/${bpNumber}`
      )

      loadProgress()

    } catch (error) {

      console.log(error)

    }

  }

  // ---------------------------------------------------
  // COUNTS
  // ---------------------------------------------------

  const completedCount = farmers.filter(farmer =>
    completedFarmers.includes(
      farmer['Bp Number']
    )
  ).length

  const pendingCount =
    farmers.length - completedCount

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------

  return (

    <div
      style={{
        minHeight: '100vh',
        background: '#f3f6f4',
        fontFamily: 'Inter, Arial, sans-serif'
      }}
    >

      {/* HEADER */}

      <div
        style={{
          background: '#1b4332',
          color: 'white',
          padding: '22px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >

        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '800'
          }}
        >
          🌿 Farm Field Dashboard
        </h1>

        <p
          style={{
            marginTop: '8px',
            opacity: 0.9
          }}
        >
          Smart team routing and farmer management
        </p>

      </div>

      {/* TOP NAVIGATION */}

      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '15px',
          background: 'white',
          borderBottom: '1px solid #e5e5e5',
          flexWrap: 'wrap'
        }}
      >

        <button
          onClick={() =>
            setActivePage('dashboard')
          }
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background:
              activePage === 'dashboard'
                ? '#1b4332'
                : '#edf2ef',
            color:
              activePage === 'dashboard'
                ? 'white'
                : '#1b4332',
            fontWeight: '700'
          }}
        >
          📋 Dashboard
        </button>

        <button
          onClick={() =>
            setActivePage('search')
          }
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background:
              activePage === 'search'
                ? '#1b4332'
                : '#edf2ef',
            color:
              activePage === 'search'
                ? 'white'
                : '#1b4332',
            fontWeight: '700'
          }}
        >
          🔍 Search Farmer
        </button>

        <button
          onClick={() =>
            setActivePage('performance')
          }
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background:
              activePage === 'performance'
                ? '#1b4332'
                : '#edf2ef',
            color:
              activePage === 'performance'
                ? 'white'
                : '#1b4332',
            fontWeight: '700'
          }}
        >
          📊 Team Performance
        </button>

      </div>

      {/* DASHBOARD */}

      {
        activePage === 'dashboard' && (

          <>
            {/* FILTER BAR */}

            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'white',
                padding: '15px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >

              <select
                value={selectedDay}
                onChange={(e) => {

                  setSelectedDay(e.target.value)

                  setSelectedTeam('')
                  setFarmers([])
                  setRoute(null)

                }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #dcdcdc',
                  minWidth: '150px'
                }}
              >

                <option value=''>
                  Select Date
                </option>

                {
                  days.map(day => (

                    <option
                      key={day}
                      value={day}
                    >
                      {day}
                    </option>

                  ))
                }

              </select>

              <select
                value={selectedTeam}
                onChange={(e) =>
                  setSelectedTeam(e.target.value)
                }
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #dcdcdc',
                  minWidth: '150px'
                }}
              >

                <option value=''>
                  Select Team
                </option>

                {
                  teams.map(team => (

                    <option
                      key={team}
                      value={team}
                    >
                      {team}
                    </option>

                  ))
                }

              </select>

              {
                route &&
                route.Route_Link &&

                <a
                  href={route.Route_Link}
                  target='_blank'
                  rel='noreferrer'
                  style={{
                    background: '#2d6a4f',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: '700'
                  }}
                >
                  🚗 Open Route
                </a>
              }

              <a
                href="https://farm-webapp-6ew5.onrender.com/download-report"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#1d3557',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '700'
                }}
              >
                📥 Download Report
              </a>

            </div>

            {/* PROGRESS */}

            <div
              style={{
                display: 'flex',
                gap: '15px',
                padding: '20px',
                flexWrap: 'wrap'
              }}
            >

              <div
                style={{
                  background: '#d8f3dc',
                  padding: '16px',
                  borderRadius: '16px',
                  minWidth: '180px'
                }}
              >
                <h3>✅ Completed</h3>
                <h1>{completedCount}</h1>
              </div>

              <div
                style={{
                  background: '#ffe5d9',
                  padding: '16px',
                  borderRadius: '16px',
                  minWidth: '180px'
                }}
              >
                <h3>⏳ Pending</h3>
                <h1>{pendingCount}</h1>
              </div>

            </div>

          </>
        )
      }

      {/* SEARCH PAGE */}

      {
        activePage === 'search' && (

          <div style={{ padding: '20px' }}>

            <div
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '20px'
              }}
            >

              <h2>
                🔍 Search Farmer
              </h2>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px'
                }}
              >

                <input

                  type="text"

                  placeholder="Search BP Number / Name / Village"

                  value={searchQuery}

                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }

                  style={{

                    flex: 1,

                    padding: '14px',

                    borderRadius: '12px',

                    border: '1px solid #ccc'

                  }}
                />

                <button

                  onClick={searchFarmer}

                  style={{

                    padding: '14px 20px',

                    borderRadius: '12px',

                    border: 'none',

                    background: '#1b4332',

                    color: 'white',

                    fontWeight: '700',

                    cursor: 'pointer'

                  }}
                >
                  Search
                </button>

              </div>

              <div style={{ marginTop: '20px' }}>

                {
                  searchResults.map((farmer, index) => (

                    <div
                      key={index}
                      style={{
                        background: '#f8faf9',
                        padding: '18px',
                        borderRadius: '16px',
                        marginBottom: '14px'
                      }}
                    >

                      <h3>
                        {farmer.bp_number}
                      </h3>

                      <p>
                        {farmer.farmer_name}
                      </p>

                      <p>
                        📍 {farmer.village}
                      </p>

                      <p>
                        📅 Day: {farmer.day}
                      </p>

                      <p>
                        👥 Team: {farmer.team}
                      </p>

                    </div>

                  ))
                }

              </div>

            </div>

          </div>

        )
      }

      {/* PERFORMANCE PAGE */}

      {
        activePage === 'performance' && (

          <div style={{ padding: '20px' }}>

            <h2>
              📊 Team Performance
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginTop: '20px'
              }}
            >

              {
                teamPerformance.map((team, index) => (

                  <div
                    key={index}
                    style={{
                      background: 'white',
                      padding: '22px',
                      borderRadius: '20px',
                      boxShadow:
                        '0 4px 14px rgba(0,0,0,0.08)'
                    }}
                  >

                    <h2>
                      {team.team}
                    </h2>

                    <p>
                      ✅ Completed:
                      {' '}
                      {team.completed}
                    </p>

                    <p>
                      ⏳ Pending:
                      {' '}
                      {team.pending}
                    </p>

                    <p>
                      📈 Efficiency:
                      {' '}
                      {team.efficiency}%
                    </p>

                  </div>

                ))
              }

            </div>

          </div>

        )
      }

    </div>
  )
}

export default App