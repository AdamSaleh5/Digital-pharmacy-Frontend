import './StatCard.css'

export default function StatCard({ title, value, change, trend, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-icon">{icon}</span>
        <span className={`stat-card-change ${trend}`}>{change}</span>
      </div>
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-title">{title}</p>
    </div>
  )
}
