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
  // LOAD PROGRESS
  // ---------------------------------------------------

  const loadProgress = async () => {

    try {

      const res = await axios.get(
        'https://farm-webapp-6ew5.onrender.com/progress'
      )

      const completed = res.data.map(
        item => item['Bp Number farms']
      )

      setCompletedFarmers(completed)

    } catch (error) {

      console.log(error)

    }

  }

  useEffect(() => {

    loadProgress()

  }, [])

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
      farmer['Bp Number farms']
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

        {/* DATE */}

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

        {/* TEAM */}

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

        {/* ROUTE BUTTON */}

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

        {/* DOWNLOAD REPORT */}

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

      {/* MAIN */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 768
              ? '1fr'
              : '390px 1fr',
          gap: '20px',
          padding: '20px'
        }}
      >

        {/* LEFT PANEL */}

        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '18px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
          }}
        >

          <h2
            style={{
              marginTop: 0,
              marginBottom: '18px',
              fontSize: '32px',
              fontWeight: '800'
            }}
          >
            📋 Assigned Farmers
          </h2>

          {
            farmers.map((farmer, index) => {

              const isCompleted =
                completedFarmers.includes(
                  farmer['Bp Number farms']
                )

              return (

                <div
                  key={index}
                  style={{
                    border: isCompleted
                      ? '2px solid #2d6a4f'
                      : '1px solid #e8ecef',

                    borderRadius: '24px',
                    padding: '20px',
                    marginBottom: '18px',
                    background: '#ffffff',
                    boxShadow:
                      '0 6px 18px rgba(0,0,0,0.06)'
                  }}
                >

                  {/* BP NUMBER */}

                  <div
                    style={{
                      fontWeight: '800',
                      color: '#1b4332',
                      fontSize: '18px'
                    }}
                  >
                    {farmer['Bp Number farms']}
                  </div>

                  {/* FARMER NAME */}

                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#2b2d42'
                    }}
                  >
                    {farmer['Farmer Name']}
                  </div>

                  {/* VILLAGE */}

                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >

                    <img
                      src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
                      alt="village"
                      style={{
                        width: '16px',
                        height: '16px',
                        opacity: 0.8
                      }}
                    />

                    <div
                      style={{
                        color: '#555',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {farmer['village']}
                    </div>

                  </div>

                  {/* PHONE */}

                  <div
                    style={{
                      marginTop: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >

                    <img
                      src="https://cdn-icons-png.flaticon.com/512/724/724664.png"
                      alt="phone"
                      style={{
                        width: '18px',
                        height: '18px'
                      }}
                    />

                    <a
                      href={`tel:${farmer['phone number']}`}
                      style={{
                        textDecoration: 'none',
                        color: '#444',
                        fontWeight: '500'
                      }}
                    >
                      {farmer['phone number']}
                    </a>

                  </div>

                  {/* SEE MORE + LOCATION */}

                  <div
                    style={{
                      marginTop: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >

                    <button
                      onClick={() => {

                        setExpandedFarmer(
                          expandedFarmer === index
                            ? null
                            : index
                        )

                      }}
                      style={{
                        flex: 1,
                        background: '#f1f5f3',
                        border: '1px solid #dbe7df',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#1b4332',
                        fontSize: '14px'
                      }}
                    >
                      {
                        expandedFarmer === index
                          ? '▲ Hide Details'
                          : '▼ See More'
                      }
                    </button>

                    <a
                      href={`https://www.google.com/maps?q=${farmer.Lat},${farmer.Long}`}
                      target='_blank'
                      rel='noreferrer'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#edf6f1',
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        flexShrink: 0
                      }}
                    >

                      <img
                        src="https://cdn-icons-png.flaticon.com/512/2991/2991231.png"
                        alt="maps"
                        style={{
                          width: '26px',
                          height: '26px'
                        }}
                      />

                    </a>

                  </div>

                  {/* DETAILS */}

                  {
                    expandedFarmer === index &&

                    <div
                      style={{
                        marginTop: '18px',
                        padding: '18px',
                        background: '#f8faf9',
                        borderRadius: '16px',
                        border: '1px solid #dde7e1'
                      }}
                    >

                      <h4
                        style={{
                          marginTop: 0,
                          marginBottom: '16px',
                          color: '#1b4332'
                        }}
                      >
                        Farmer Details
                      </h4>

                      {
                        Object.entries(farmer).map(
                          ([key, value]) => (

                            <div
                              key={key}
                              style={{
                                marginBottom: '10px',
                                fontSize: '14px',
                                lineHeight: '1.6'
                              }}
                            >

                              <strong>
                                {key}:
                              </strong>

                              {' '}

                              {String(value)}

                            </div>

                          )
                        )
                      }

                    </div>
                  }

                  {/* ACTION */}

                  <div
                    style={{
                      marginTop: '20px'
                    }}
                  >

                    {
                      !isCompleted &&

                      <button
                        onClick={() =>
                          completeFarmer(
                            farmer['Bp Number farms']
                          )
                        }
                        style={{
                          width: '100%',
                          background:
                            'linear-gradient(135deg, #2d6a4f, #1b4332)',
                          color: 'white',
                          border: 'none',
                          padding: '16px',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        ✅ Mark Complete
                      </button>
                    }

                    {
                      isCompleted &&

                      <button
                        onClick={() =>
                          undoComplete(
                            farmer['Bp Number farms']
                          )
                        }
                        style={{
                          width: '100%',
                          background:
                            'linear-gradient(135deg, #c1121f, #9b2226)',
                          color: 'white',
                          border: 'none',
                          padding: '16px',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        ↩ Undo Completion
                      </button>
                    }

                  </div>

                </div>

              )

            })
          }

        </div>

        {/* MAP */}

        <div>

          <button
            onClick={() =>
              setShowMap(!showMap)
            }
            style={{
              background: '#1d3557',
              color: 'white',
              border: 'none',
              padding: '14px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              marginBottom: '15px',
              fontWeight: '700',
              width: '100%'
            }}
          >
            {
              showMap
                ? '❌ Close Map'
                : '🗺 Open Map'
            }
          </button>

          {
            showMap &&

            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow:
                  '0 4px 14px rgba(0,0,0,0.08)'
              }}
            >

              <MapContainer
                center={[12.2958, 75.6433]}
                zoom={10}
                style={{
                  height: '80vh',
                  width: '100%'
                }}
              >

                <ZoomToFarmers farmers={farmers} />

                <FixMapResize />

                <TileLayer
                  attribution='Google Hybrid'
                  url='https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                />

                {
                  farmers
                    .filter(farmer =>
                      farmer.Lat &&
                      farmer.Long
                    )
                    .map((farmer, index) => (

                      <Marker
                        key={index}
                        position={[
                          parseFloat(farmer.Lat),
                          parseFloat(farmer.Long)
                        ]}
                      >

                        <Popup>

                          <div
                            style={{
                              minWidth: '180px'
                            }}
                          >

                            <h3>
                              {farmer['Bp Number farms']}
                            </h3>

                            <p>
                              {farmer['Farmer Name']}
                            </p>

                          </div>

                        </Popup>

                      </Marker>

                    ))
                }

              </MapContainer>

            </div>
          }

        </div>

      </div>

    </div>
  )
}

export default App