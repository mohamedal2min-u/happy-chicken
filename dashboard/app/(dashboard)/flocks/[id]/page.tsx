'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function FlockDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#f0f4f8',
      color: '#333'
    }}>
      <h1 style={{ fontSize: '4rem' }}>Hello World 🐔</h1>
      <p style={{ fontSize: '1.5rem' }}>أهلاً بك في صفحة تجربة الفوج رقم: {id}</p>
      <button 
        onClick={() => router.back()} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#1a5f7a', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer' 
        }}>
        العودة للخلف
      </button>
    </div>
  );
}
