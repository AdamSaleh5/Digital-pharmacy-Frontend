import { useState } from 'react'
import StatCard from '../components/StatCard'
import './Dashboard.css'

const stats = [
  { title: 'إجمالي الأدوية', value: '١٬٢٤٨', change: '+12%', trend: 'up', icon: '💊' },
  { title: 'الطلبات اليوم', value: '٤٣', change: '+8%', trend: 'up', icon: '📦' },
  { title: 'العملاء النشطين', value: '٨٩٢', change: '+23%', trend: 'up', icon: '👥' },
  { title: 'الإيرادات (الشهر)', value: '٤٥٬٢٠٠ ر.س', change: '+5%', trend: 'up', icon: '💰' },
]

const recentOrders = [
  { id: 1001, customer: 'أحمد محمد', items: 3, total: '٢٤٥ ر.س', time: 'منذ ١٠ دقائق' },
  { id: 1002, customer: 'سارة علي', items: 1, total: '٨٩ ر.س', time: 'منذ ٢٥ دقيقة' },
  { id: 1003, customer: 'خالد عبدالله', items: 5, total: '٤٢٠ ر.س', time: 'منذ ساعة' },
  { id: 1004, customer: 'نورة أحمد', items: 2, total: '١٥٦ ر.س', time: 'منذ ساعتين' },
  { id: 1005, customer: 'عمر حسن', items: 4, total: '٣١٠ ر.س', time: 'منذ ٣ ساعات' },
]

export default function Dashboard() {
  return (
    <>
      <section className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>
      <div className="content-grid">
        <section className="chart-section card">
          <h3 className="section-title">مبيعات آخر ٧ أيام</h3>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {[65, 45, 78, 52, 90, 70, 85].map((h, i) => (
                <div
                  key={i}
                  className="chart-bar"
                  style={{ height: `${h}%` }}
                  title={`اليوم ${i + 1}`}
                />
              ))}
            </div>
            <span className="chart-label">الأيام</span>
          </div>
        </section>
        <section className="recent-orders card">
          <h3 className="section-title">آخر الطلبات</h3>
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>الطلب</th>
                  <th>العميل</th>
                  <th>العدد</th>
                  <th>المبلغ</th>
                  <th>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.items}</td>
                    <td>{order.total}</td>
                    <td>{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
