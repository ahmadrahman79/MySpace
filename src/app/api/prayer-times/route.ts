import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 1. Detect Client IP & City
    let ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      ip = ''; // Let ip-api detect automatically
    }

    let city = 'Pontianak';
    let region = 'Kalimantan Barat';
    let cityId = '2013'; // Default Pontianak

    try {
      const geoUrl = ip ? `http://ip-api.com/json/${ip}` : 'http://ip-api.com/json';
      const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === 'success' && geoData.city) {
          city = geoData.city;
          region = geoData.regionName || region;

          // Search City ID in MyQuran database
          const searchRes = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(city)}`);
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.status && searchData.data && searchData.data.length > 0) {
              cityId = searchData.data[0].id;
              city = searchData.data[0].lokasi;
            }
          }
        }
      }
    } catch (geoErr) {
      console.warn('Geolocation lookup failed, using default Pontianak:', geoErr);
    }

    // 2. Fetch today's schedule
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    const scheduleUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${y}/${m}/${d}`;
    const schedRes = await fetch(scheduleUrl, { next: { revalidate: 1800 } });

    if (schedRes.ok) {
      const json = await schedRes.json();
      if (json.status && json.data && json.data.jadwal) {
        return NextResponse.json({
          success: true,
          source: 'NU Online / Kemenag SIHAT Standard',
          city,
          region,
          cityId,
          schedule: json.data.jadwal,
        });
      }
    }

    // Fallback schedule
    return NextResponse.json({
      success: true,
      source: 'NU Online Standard (Fallback)',
      city: 'Pontianak',
      region: 'Kalimantan Barat',
      schedule: {
        tanggal: `${d}/${m}/${y}`,
        imsak: '03:55',
        subuh: '04:05',
        terbit: '05:20',
        dhuha: '05:48',
        dzuhur: '11:30',
        ashar: '14:50',
        maghrib: '17:33',
        isya: '18:44',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
