import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import '../App.css';

Chart.register(...registerables);

const Dashboard = ({ statusCounts, dailyLeadData, handleDashboardBlockClick }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dailyLeadData.labels,
          datasets: [{
            label: 'Leads',
            data: dailyLeadData.data,
            backgroundColor: 'rgba(88, 91, 255, 0.6)',
            borderColor: 'rgba(88, 91, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Number of Leads' }
            },
            x: {
              title: { display: true, text: 'Date' }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [dailyLeadData]);

  return (
    <div className="dashboard-section">
      <h1 className="leads-management-title">Dashboard</h1>
      <div className="dashboard-blocks">
        <div className="new-leads-box" onClick={() => handleDashboardBlockClick('New Leads Today')}>
          <div className="new-leads-info">
            <span className="new-leads-count">
              <div>New Leads Today</div>
              <strong className="new-leads-number">{statusCounts['New Leads Today']}</strong>
            </span>
          </div>
        </div>
        <div className="new-leads-box" onClick={() => handleDashboardBlockClick('Calls to Attend')}>
          <div className="new-leads-info">
            <span className="new-leads-count">
              <div>Calls to Attend</div>
              <strong className="new-leads-number">{statusCounts['Calls to Attend']}</strong>
            </span>
          </div>
        </div>
        <div className="new-leads-box" onClick={() => handleDashboardBlockClick('Meeting 1 to Attend')}>
          <div className="new-leads-info">
            <span className="new-leads-count">
              <div>Meeting 1 to Attend</div>
              <strong className="new-leads-number">{statusCounts['Meeting 1 to Attend']}</strong>
            </span>
          </div>
        </div>
        <div className="new-leads-box" onClick={() => handleDashboardBlockClick('Meeting 2 to Attend')}>
          <div className="new-leads-info">
            <span className="new-leads-count">
              <div>Meeting 2 to Attend</div>
              <strong className="new-leads-number">{statusCounts['Meeting 2 to Attend']}</strong>
            </span>
          </div>
        </div>
        <div className="new-leads-box" onClick={() => handleDashboardBlockClick('Meeting 3 to Attend')}>
          <div className="new-leads-info">
            <span className="new-leads-count">
              <div>Meeting 3 to Attend</div>
              <strong className="new-leads-number">{statusCounts['Meeting 3 to Attend']}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="chart-container">
        <h2>Daily Lead Generation</h2>
        <canvas id="leadChart" ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Dashboard;