'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface Stats {
  totalLocks: number;
  availableLocks: number;
  bookedLocks: number;
  totalStaff: number;
}

interface Activity {
  id: string;
  type: 'booking' | 'payment';
  title: string;
  user: string;
  timestamp: string;
  status: string;
}

interface RevenuePoint {
  date: string;
  amount: number;
}

interface ZoneStat {
  name: string;
  occupied: number;
  total: number;
  percentage: number;
}

interface ChartData {
  revenueData: RevenuePoint[];
  zoneStats: ZoneStat[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes, chartsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/activities'),
          fetch('/api/admin/charts')
        ]);

        if (!statsRes.ok || !activitiesRes.ok || !chartsRes.ok) throw new Error('Failed to fetch data');

        const [statsData, activitiesData, chartsData] = await Promise.all([
          statsRes.json(),
          activitiesRes.json(),
          chartsRes.json()
        ]);

        setStats(statsData);
        setActivities(activitiesData);
        setCharts(chartsData);
      } catch (err) {
        console.error(err);
        setError('ไม่สามารถโหลดข้อมูลสถิติได้');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const getStatusBadge = (type: string, status: string) => {
    if (type === 'payment') {
      return status === 'approved' ? <Badge bg="success">อนุมัติแล้ว</Badge> : <Badge bg="danger">ปฏิเสธ</Badge>;
    }
    // Booking statuses
    switch (status) {
      case 'active': return <Badge bg="success">ใช้งาน</Badge>;
      case 'pending_payment': return <Badge bg="warning">รอจ่ายเงิน</Badge>;
      case 'pending_verification': return <Badge bg="info">รอตรวจสอบ</Badge>;
      default: return <Badge bg="secondary" className="opacity-75">{status}</Badge>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val);
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <Container fluid className="px-md-4 pb-5">
      <div className="mb-4">
        <h2 className="fw-bold">หน้าแรก</h2>
        <p className="text-muted">ยินดีต้อนรับสู่ระบบจัดการตลาด MarketHub (สำหรับเจ้าหน้าที่)</p>
      </div>

      {error && <Alert variant="danger" className="border-0 shadow-sm mb-4">{error}</Alert>}

      {/* Stats Summary */}
      <Row className="g-4 mb-4">
        {[
          { title: 'ล็อกทั้งหมด', value: stats?.totalLocks, icon: 'bi-shop', color: 'primary' },
          { title: 'ล็อกที่ว่าง', value: stats?.availableLocks, icon: 'bi-check-circle', color: 'success' },
          { title: 'จองแล้ว', value: stats?.bookedLocks, icon: 'bi-calendar-check', color: 'warning', textColor: 'dark' },
          { title: 'จำนวนทีมงาน', value: stats?.totalStaff, icon: 'bi-people', color: 'info' }
        ].map((item, idx) => (
          <Col key={idx} md={6} lg={3}>
            <Card className={`border-0 shadow-sm bg-${item.color} text-${item.textColor || 'white'} rounded-4 overflow-hidden h-100`}>
              <Card.Body className="p-4 position-relative">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="z-1">
                    <h6 className="text-uppercase mb-2 opacity-75 small fw-bold">{item.title}</h6>
                    <h2 className="mb-0 fw-bold display-6">{item.value?.toLocaleString() || 0}</h2>
                  </div>
                  <i className={`bi ${item.icon} position-absolute top-50 end-0 translate-middle-y me-3 opacity-25`} style={{ fontSize: '4.5rem' }}></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 py-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
                รายงานรายได้ (7 วันล่าสุด)
              </h5>
              {charts && charts.revenueData.length > 0 && (
                <div className="text-primary fw-bold">
                  รวม: {formatCurrency(charts.revenueData.reduce((acc, curr) => acc + curr.amount, 0))}
                </div>
              )}
            </Card.Header>
            <Card.Body className="pt-0" style={{ height: '300px' }}>
              {charts && charts.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatShortDate} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#999', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#999', fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'รายได้']}
                      labelFormatter={(label: string | number) => new Date(label).toLocaleDateString('th-TH', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#0d6efd" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0d6efd', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                  ไม่พบข้อมูลรายได้ในช่วงนี้
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 py-4">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-pie-chart me-2 text-success"></i>
                การจองแต่ละโซน
              </h5>
            </Card.Header>
            <Card.Body className="pt-0" style={{ height: '300px' }}>
              {charts && charts.zoneStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.zoneStats} layout="vertical" margin={{ left: -20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 13, fontWeight: 500 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} ล็อก`, 'ถูกจอง']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="occupied" radius={[0, 10, 10, 0]} barSize={20}>
                      {charts.zoneStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#6f42c1'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">
                  ไม่พบข้อมูลโซน
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Activity Table */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Header className="bg-white border-0 py-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                กิจกรรมล่าสุด (Activity)
              </h5>
            </Card.Header>
            <Card.Body className="pt-0">
              {activities.length === 0 ? (
                <div className="text-center py-5 text-muted">ไม่พบความเคลื่อนไหวล่าสุดในขณะนี้</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light border-0">
                      <tr>
                        <th className="border-0 bg-transparent text-muted small py-3 ps-3">หัวข้อ</th>
                        <th className="border-0 bg-transparent text-muted small py-3">โดย</th>
                        <th className="border-0 bg-transparent text-muted small py-3">สถานะ</th>
                        <th className="border-0 bg-transparent text-muted small py-3 text-end pe-3">เวลา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((act) => (
                        <tr key={act.id}>
                          <td className="py-3 border-0 ps-3">
                            <i className={`bi ${act.type === 'booking' ? 'bi-calendar-plus text-primary' : act.status === 'approved' ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2`}></i>
                            <span className="fw-medium">{act.title}</span>
                          </td>
                          <td className="py-3 border-0 text-muted small">{act.user}</td>
                          <td className="py-3 border-0">{getStatusBadge(act.type, act.status)}</td>
                          <td className="py-3 border-0 text-end pe-3 text-muted small">
                            {new Date(act.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* System Status & Info */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-white border-0 py-4">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-shield-check me-2 text-success"></i>
                สถานะระบบ
              </h5>
            </Card.Header>
            <Card.Body className="pt-0 pb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-hdd-network text-success"></i>
                  </div>
                  <span className="fw-medium">API Connection</span>
                </div>
                <Badge bg="success" pill className="px-3">Online</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-database text-success"></i>
                  </div>
                  <span className="fw-medium">Database</span>
                </div>
                <Badge bg="success" pill className="px-3">Connected</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-0">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-cloud-check text-success"></i>
                  </div>
                  <span className="fw-medium">Cloudinary</span>
                </div>
                <Badge bg="success" pill className="px-3">Ready</Badge>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm rounded-4 bg-primary text-white border-start border-primary border-5">
            <Card.Body className="p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-lightning-charge display-4 opacity-75"></i>
              </div>
              <h5 className="fw-bold mb-2">MarketHub Pro</h5>
              <p className="small opacity-75 mb-0">
                ระบบจัดการพื้นที่ตลาดออนไลน์ พร้อมใช้งานสำหรับเจ้าหน้าที่ทุกคน เพื่อความโปร่งใสและรวดเร็ว
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
