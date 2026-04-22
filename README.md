# Supply Chain Continuous Improvement Tracker

A comprehensive web application for tracking supply chain continuous improvement initiatives, KPIs, DMAIC projects, After Action Reports, and process documentation.

## Features

- **Dashboard**: KPI summary, This Week panel, project health overview, root cause Pareto analysis
- **KPIs**: Track metrics with data points, trends, and charts
- **Projects**: Manage CI projects with DMAIC status, actions, and health indicators
- **DMAIC**: Structured Define-Measure-Analyze-Improve-Control framework
- **After Action Reports**: Document incidents with 5 Whys analysis and countermeasures
- **Process Library**: Maintain process documentation with steps, failure modes, and front-to-back views
- **Meetings/Cadence**: Track functional meetings with action items and cadence planning
- **Data Management**: Export/import data, reset to sample data

## Quick Start

### Running Locally

1. **Open the application**:
   - Simply open `index.html` in any modern web browser
   - No server or installation required!

2. **Sample data is pre-loaded** on first launch with:
   - 6 KPIs (OTIF, Schedule Adherence, Expedites, Premium Freight, Inventory Turns, Supplier OTD)
   - 3 Projects with actions and DMAIC records
   - 5 After Action Reports
   - 3 Process documents
   - 3 Meetings

### File Structure

```
/Users/davy/Code/CI/
├── index.html       # Main HTML structure
├── styles.css       # All styling
├── app.js          # Application logic (complete)
└── README.md       # This file
```

## Using the Application

### Navigation

Use the left sidebar to navigate between sections:
- **Dashboard**: Overview of all activities
- **KPIs**: Manage key performance indicators
- **Projects**: CI project backlog
- **DMAIC**: Detailed project methodology
- **After Action Reports**: Incident tracking and analysis
- **Process Library**: Process documentation
- **Meetings/Cadence**: Meeting management
- **Settings**: Data management

### Key Workflows

#### Create a New Project
1. Go to Projects page
2. Click "+ Create Project"
3. Fill in title, problem statement, owner, dates, etc.
4. Add actions as work progresses
5. Link to DMAIC and AARs

#### Track KPIs
1. Go to KPIs page
2. Click "+ Add KPI"
3. Define KPI with target and cadence
4. Click on KPI card to add data points
5. View trend chart and history

#### Document an Incident (AAR)
1. Go to After Action Reports
2. Click "+ Create AAR"
3. Fill in incident details and impact
4. Complete 5 Whys analysis
5. Define countermeasures
6. Link to related project (optional)

#### DMAIC Project Details
1. Go to DMAIC page
2. Select a project from dropdown
3. Navigate through Define → Measure → Analyze → Improve → Control tabs
4. Fill in structured fields for each phase
5. Click "Generate Summary" to create shareable document

#### Process Documentation
1. Go to Process Library
2. Click "+ Add Process"
3. Define purpose, inputs/outputs, partners
4. Add process steps (reorder with up/down arrows)
5. Document failure modes
6. System warns if not reviewed in 90+ days

#### Meeting Cadence
1. Go to Meetings/Cadence
2. Cadence Planner shows areas overdue for meetings
3. Click "+ Schedule Meeting"
4. Record notes, decisions, action items
5. Set next meeting date

### Data Management

#### Export Data
1. Go to Settings page
2. Click "Export All Data (JSON)"
3. JSON file downloads to your computer
4. Safe backup of all data

#### Import Data
1. Go to Settings page
2. Click "Import Data from JSON"
3. Select previously exported JSON file
4. Confirms before replacing data

#### Reset to Sample Data
1. Go to Settings page
2. Click "Reset to Sample Data"
3. Confirms before deleting current data
4. Useful for testing or starting fresh

## Data Storage

- All data stored in browser's **localStorage**
- Data persists across browser sessions
- Specific to this browser on this computer
- **Important**: Clearing browser data will delete all records
- Regular exports recommended for backup

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires:
- JavaScript enabled
- localStorage support
- HTML5 Canvas support (for KPI charts)

## Tips & Best Practices

1. **Regular Updates**: Use "Mark Updated Today" on projects to track progress
2. **Overdue Actions**: Dashboard "This Week" panel highlights overdue items
3. **Link AARs to Projects**: Connect incidents to improvement initiatives
4. **90-Day Review**: Process Library warns when docs need review
5. **Cadence Planning**: Keep functional meeting rhythm with cadence tracker
6. **Export Regularly**: Backup data weekly or before major changes
7. **Health Indicators**: Use traffic light status to escalate at-risk projects

## Troubleshooting

**Data not saving?**
- Check that JavaScript is enabled
- Verify localStorage is not disabled
- Check browser console for errors

**Page not loading?**
- Ensure all three files (index.html, styles.css, app.js) are in same directory
- Try opening in different browser
- Check browser console for errors

**Lost data?**
- If browser data was cleared, data is unrecoverable unless exported
- Import most recent export file

**Performance issues?**
- Large datasets (100+ projects) may slow down
- Consider archiving closed projects by export/import with filtering

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Storage**: Browser localStorage (5-10MB limit)
- **Charts**: HTML5 Canvas (native)
- **Architecture**: Single-page application with client-side routing
- **Data Model**: JSON-based with UUID identifiers

## Support

For issues or questions:
- Check browser console for error messages
- Verify all files are present and unmodified
- Try reset to sample data to test functionality

## Version

Version 1.0 - Supply Chain CI Tracker

---

**Built for supply chain continuous improvement teams to track projects, analyze problems, and drive operational excellence.**
