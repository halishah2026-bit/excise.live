const express = require('express');
const router = express.Router();
const VehicleRecord = require('../models/VehicleRecord');
const SearchLog = require('../models/SearchLog');
const { protect } = require('../middleware/auth');

router.use(protect);

const ISLAMABAD_QUERY_API =
  process.env.ISLAMABAD_QUERY_API ||
  'https://asadmughalfoundation.online/elookup/ict/search.php';

const Notification = require('../models/Notification');

const logSearch = async (userId, userName, service, searchType, query, result, location) => {
  await SearchLog.create({
    userId,
    userName,
    service,
    searchType,
    searchQuery: query,
    resultFound: !!result,
    resultData: result,
    location: location || undefined,
  });
  await require('../models/User').findByIdAndUpdate(userId, { $inc: { searchCount: 1 } });
};

const createAdminNotification = async (service, query, results, location) => {
  if (!results) return;
  const records = Array.isArray(results) ? results : [results];
  const stolenCount = records.filter(r => r && r.isStolen).length;
  const noncustomCount = records.filter(r => r && r.isNonCustom).length;
  if (!stolenCount && !noncustomCount) return;
  const title = stolenCount ? `Stolen vehicle alert — ${service}` : `Non-Custom vehicle alert — ${service}`;
  const messageParts = [];
  if (stolenCount) messageParts.push(`${stolenCount} stolen`);
  if (noncustomCount) messageParts.push(`${noncustomCount} non-custom`);
  const message = `${messageParts.join(' & ')} record(s) found for query ${query}`;
  try {
    await Notification.create({
      title,
      message,
      type: stolenCount ? 'stolen' : 'noncustom',
      targetRoles: ['superadmin', 'admin'],
      meta: { service, query, count: records.length, stolenCount, noncustomCount },
      location: location || undefined,
    });
  } catch (err) {
    console.error('Failed to create admin notification', err.message);
  }
};

const cleanText = (value) => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).replace(/\r/g, '').trim();
  return text || undefined;
};

const normalizeIslamabadQuery = (searchType, searchValue) => {
  const raw = cleanText(searchValue);
  if (!raw) return '';

  if (searchType === 'registration') return raw.toUpperCase();
  if (searchType === 'cnic') return raw.replace(/-/g, '');
  if (searchType === 'chassis') return raw.toUpperCase();
  if (searchType === 'engine') return raw.toUpperCase();
  return '';
};

const cleanSearchValue = (searchType, searchValue) => {
  const raw = cleanText(searchValue);
  if (!raw) return '';
  if (searchType === 'registration') return raw.toUpperCase().replace(/\s/g, '');
  if (searchType === 'cnic') return raw.replace(/-/g, '');
  if (searchType === 'chassis') return raw.toUpperCase();
  if (searchType === 'engine') return raw.toUpperCase();
  return raw;
};

const splitCompany = (company) => {
  const text = cleanText(company);
  if (!text) return { vehicleMake: undefined, vehicleModel: undefined };
  const parts = text.split(/\s*-\s*/);
  if (parts.length < 2) return { vehicleMake: text, vehicleModel: undefined };
  return {
    vehicleMake: cleanText(parts[0]),
    vehicleModel: cleanText(parts.slice(1).join(' - ')),
  };
};

const mapIslamabadRecord = (record) => {
  const { vehicleMake, vehicleModel } = splitCompany(record.Company);

  const additionalInfo = {};
  if (cleanText(record.Registration_Date)) additionalInfo['Registration Date'] = cleanText(record.Registration_Date);
  if (cleanText(record.Father_Name)) additionalInfo['Father Name'] = cleanText(record.Father_Name);
  if (record.id !== null && record.id !== undefined) additionalInfo['Source ID'] = String(record.id);

  return {
    registrationNo: cleanText(record.Registration_No),
    ownerName: cleanText(record.Name),
    ownerCnic: cleanText(record.CNIC_No),
    ownerAddress: cleanText(record.Address),
    vehicleMake,
    vehicleModel,
    vehicleType: cleanText(record.Type),
    engineNo: cleanText(record.Engine_No),
    chassisNo: cleanText(record.Chassis_No),
    engineCapacity: cleanText(record.Engine_Size),
    tokenTax: cleanText(record.Tex_Paid_upto),
    province: 'islamabad',
    additionalInfo,
  };
};

const BALOCHISTAN_DISTRICTS = [
  'Quetta','Gwadar','Turbat','Khuzdar','Chaman','Sibi','Zhob','Loralai','Dera Bugti',
  'Nushki','Pishin','Mastung','Kalat','Panjgur','Washuk','Kech','Awaran','Lasbela','Jaffarabad',
  'Nasirabad','Jhal Magsi','Bolan','Ziarat','Harnai','Sherani','Musakhel','Barkhan','Kohlu',
  'Dera Murad Jamali','Kharan','Chaghai','Dalbandin','Kharan'
];

const getBalochistanDistrictId = (district) => {
  if (district === undefined || district === null) return undefined;
  const numeric = String(district).trim();
  if (/^\d+$/.test(numeric)) return numeric;
  const index = BALOCHISTAN_DISTRICTS.findIndex((name) => name.toLowerCase() === numeric.toLowerCase());
  return index === -1 ? undefined : String(index + 1);
};

const buildAdditionalInfo = (record, excludedKeys = []) => {
  const additionalInfo = {};
  if (!record || typeof record !== 'object') return additionalInfo;
  for (const [key, value] of Object.entries(record)) {
    if (excludedKeys.includes(key)) continue;
    if (value === null || value === undefined || String(value).trim() === '') continue;
    additionalInfo[key] = value;
  }
  return additionalInfo;
};

const stripVehicleImage = (record) => {
  if (Array.isArray(record)) return record.map(stripVehicleImage);
  if (!record || typeof record !== 'object') return record;
  const cleaned = { ...record };
  delete cleaned.VEH_IMAGE;
  delete cleaned.Veh_Image;
  delete cleaned.veh_image;
  return cleaned;
};

const mapExternalRecord = (record, province, mapping) => {
  const mapped = { province, additionalInfo: {} };
  for (const [target, sourceKey] of Object.entries(mapping)) {
    if (record[sourceKey] !== undefined && record[sourceKey] !== null) {
      mapped[target] = cleanText(record[sourceKey]);
    }
  }
  mapped.additionalInfo = buildAdditionalInfo(record, Object.values(mapping));
  return mapped;
};

const hasVehicleIdentity = (vehicle) => {
  if (!vehicle || typeof vehicle !== 'object') return false;
  return Boolean(
    cleanText(vehicle.registrationNo) ||
    cleanText(vehicle.engineNo) ||
    cleanText(vehicle.chassisNo) ||
    cleanText(vehicle.ownerCnic)
  );
};

const sanitizeResult = (result) => {
  if (!result) return result;
  if (Array.isArray(result)) return result.map(stripVehicleImage);
  return stripVehicleImage(result);
};

const findStolenRecord = async ({ registrationNo, engineNo, chassisNo, ownerCnic }) => {
  const query = [];
  if (registrationNo) query.push({ registrationNo });
  if (engineNo) query.push({ engineNo });
  if (chassisNo) query.push({ chassisNo });
  if (ownerCnic) query.push({ ownerCnic });
  if (!query.length) return null;
  return await VehicleRecord.findOne({ province: 'stolen', isStolen: true, $or: query });
};

const markRecordAsStolen = async (record) => {
  if (!record || record.isStolen) return record;
  const stolen = await findStolenRecord(record);
  if (!stolen) return record;
  return {
    ...record,
    isStolen: true,
    status: 'stolen',
    stolenDate: record.stolenDate || stolen.stolenDate,
    stolenFrom: record.stolenFrom || stolen.stolenFrom,
    additionalInfo: {
      ...(record.additionalInfo || {}),
      stolenAlert: 'Matched stolen database',
    },
  };
};

const markResultsAsStolen = async (results) => {
  if (Array.isArray(results)) {
    return await Promise.all(results.map(markRecordAsStolen));
  }
  return await markRecordAsStolen(results);
};

// Punjab - Registration No only
router.post('/punjab', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) return res.status(400).json({ success: false, message: 'Search type and value required' });
    if (searchType !== 'registration' && searchType !== 'cnic') {
      return res.status(400).json({ success: false, message: 'Punjab search only supports Registration or CNIC' });
    }

    const query = cleanSearchValue(searchType, searchValue);
    const url = `https://unbaffling-seymour-bryological.ngrok-free.dev/api/punjab-vehicle.php?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Punjab API failed with status ${response.status}`);
    const payload = await response.json();
    const rawVehicles = payload?.records
      ? payload.records
      : Array.isArray(payload)
      ? payload
      : payload
      ? [payload]
      : [];
    let vehicles = rawVehicles.map(stripVehicleImage).map((v) => mapExternalRecord(v, 'punjab', {
      registrationNo: 'registration_no',
      ownerName: 'owner_name',
      ownerCnic: 'cnic_ntn',
      ownerAddress: 'owner_present_address',
      engineNo: 'engine_number',
      chassisNo: 'chassis_number',
      engineCapacity: 'engine_size',
      vehicleMake: 'make_name',
      vehicleType: 'vehicle_body_type',
      vehicleModel: 'vehicle_type',
      tokenTax: 'token_tax',
      district: 'registration_district',
    })).filter(hasVehicleIdentity);

    if (!vehicles.length) {
      const dbVehicle = await VehicleRecord.findOne({ province: 'punjab', [searchType === 'registration' ? 'registrationNo' : 'ownerCnic']: query });
      await logSearch(req.user._id, req.user.name, 'Punjab', searchType, searchValue, dbVehicle || null, req.body.location);
      const vehicle = dbVehicle ? await markResultsAsStolen(dbVehicle) : null;
      await createAdminNotification('Punjab', searchValue, vehicle, req.body.location);
      return res.json({ success: true, found: !!vehicle, data: vehicle });
    }

    vehicles = await markResultsAsStolen(vehicles);
    await logSearch(req.user._id, req.user.name, 'Punjab', searchType, searchValue, vehicles, req.body.location);
    await createAdminNotification('Punjab', searchValue, vehicles, req.body.location);
    res.json({ success: true, found: true, data: vehicles, source: 'external' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Islamabad - CNIC, Chassis, Engine, Registration No
router.post('/islamabad', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) {
      return res.status(400).json({ success: false, message: 'Search type and value required' });
    }

    const query = normalizeIslamabadQuery(searchType, searchValue);
    if (!query) {
      return res.status(400).json({ success: false, message: 'Invalid search type or value' });
    }

    const url = `${ISLAMABAD_QUERY_API}?query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Islamabad API failed with status ${response.status}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const mappedVehicles = rows.map(mapIslamabadRecord);
    const hasResults = mappedVehicles.length > 0;

    await logSearch(
      req.user._id,
      req.user.name,
      'Islamabad',
      searchType,
      String(searchValue),
      hasResults ? mappedVehicles : null,
      req.body.location
    );
    await createAdminNotification('Islamabad', String(searchValue), hasResults ? mappedVehicles : null, req.body.location);

    res.json({
      success: true,
      found: hasResults,
      data: hasResults ? mappedVehicles : null,
      source: 'external',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sindh - CNIC, Chassis, Engine, Registration No
router.post('/sindh', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) return res.status(400).json({ success: false, message: 'Search type and value required' });
    const query = cleanSearchValue(searchType, searchValue);
    let payload;

    if (searchType === 'engine' || searchType === 'chassis') {
      const field = searchType === 'engine' ? 'field3' : 'field4';
      const formData = new FormData();
      formData.append('category', field);
      formData.append('value', query);
      formData.append('wheel', 'both');
      const response = await fetch('https://cplc.sindhpolice.excise.live/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Sindh engine/chassis API failed with status ${response.status}`);
      payload = await response.json();
      const vehicles = Array.isArray(payload.results) ? payload.results.map(stripVehicleImage).map((v) => mapExternalRecord(v, 'sindh', {
        registrationNo: 'field2',
        ownerName: 'field11',
        ownerCnic: 'field14',
        ownerAddress: 'field13',
        vehicleMake: 'field5',
        vehicleModel: 'field6',
        vehicleType: 'field1',
        engineNo: 'field3',
        chassisNo: 'field4',
        engineCapacity: 'field6',
        vehicleYear: 'field8',
        color: 'field9',
      })).filter(hasVehicleIdentity) : [];
      const results = await markResultsAsStolen(vehicles);
      await logSearch(req.user._id, req.user.name, 'Sindh', searchType, searchValue, results, req.body.location);
      await createAdminNotification('Sindh', searchValue, results, req.body.location);
      return res.json({ success: true, found: results.length > 0, data: results, source: 'external' });
    }

    const response = await fetch(`https://unbaffling-seymour-bryological.ngrok-free.dev/api/sindh-vehicle.php?searchValue=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Sindh API failed with status ${response.status}`);
    payload = await response.json();
    const vehicle = payload ? mapExternalRecord(stripVehicleImage(payload), 'sindh', {
      registrationNo: 'registration_no',
      ownerName: 'owner_name',
      ownerCnic: 'cnic',
      ownerAddress: 'address',
      vehicleMake: 'manufacturer',
      vehicleModel: 'model',
      vehicleType: 'vehicle_type',
      engineNo: 'engine_no',
      chassisNo: 'chassis_no',
      engineCapacity: 'engine_capacity',
      fuelType: 'fuel_type',
      tokenTax: 'tax_paid_upto',
    }) : null;

    if (!vehicle || !vehicle.registrationNo) {
      const dbVehicle = await VehicleRecord.findOne({ province: 'sindh', [searchType === 'registration' ? 'registrationNo' : searchType === 'cnic' ? 'ownerCnic' : searchType === 'chassis' ? 'chassisNo' : 'engineNo']: query });
      await logSearch(req.user._id, req.user.name, 'Sindh', searchType, searchValue, dbVehicle || null, req.body.location);
      await createAdminNotification('Sindh', searchValue, dbVehicle || null, req.body.location);
      const result = dbVehicle ? await markResultsAsStolen(dbVehicle) : null;
      return res.json({ success: true, found: !!result, data: result });
    }

    const result = await markResultsAsStolen(vehicle);
    await logSearch(req.user._id, req.user.name, 'Sindh', searchType, searchValue, result, req.body.location);
    await createAdminNotification('Sindh', searchValue, result, req.body.location);
    res.json({ success: true, found: true, data: result, source: 'external' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// KPK - CNIC, Chassis, Engine, Registration No
router.post('/kpk', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) return res.status(400).json({ success: false, message: 'Search type and value required' });
    const query = cleanSearchValue(searchType, searchValue);
    const response = await fetch(`https://vehicleverificationsystem.com/api/kpkexcise.php?verify=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`KPK API failed with status ${response.status}`);
    const payload = await response.json();
    const vehicles = Array.isArray(payload?.records) ? payload.records.map(stripVehicleImage).map((v) => mapExternalRecord(v, 'kpk', {
      registrationNo: 'REGISTRATION_NO',
      ownerName: 'OWNER_NAME',
      ownerCnic: 'CNIC',
      ownerAddress: 'CURRENT_ADDRESS',
      vehicleMake: 'MAKE_NAME',
      vehicleModel: 'MAKER_NAME',
      vehicleType: 'CAT_NAME',
      engineNo: 'ENGINE_NO',
      chassisNo: 'CHASIS_NO',
      engineCapacity: 'ENGINE_CAPACITY',
      tokenTax: 'TOKEN_TAX',
      district: 'VEH_DISTRICT',
    })).filter(hasVehicleIdentity) : [];

    if (!vehicles.length) {
      const dbVehicle = await VehicleRecord.findOne({ province: 'kpk', [searchType === 'registration' ? 'registrationNo' : searchType === 'cnic' ? 'ownerCnic' : searchType === 'chassis' ? 'chassisNo' : 'engineNo']: query });
      await logSearch(req.user._id, req.user.name, 'KPK', searchType, searchValue, dbVehicle || null, req.body.location);
      await createAdminNotification('KPK', searchValue, dbVehicle || null, req.body.location);
      const result = dbVehicle ? await markResultsAsStolen(dbVehicle) : null;
      return res.json({ success: true, found: !!result, data: result });
    }

    const results = await markResultsAsStolen(vehicles);
    await logSearch(req.user._id, req.user.name, 'KPK', searchType, searchValue, results, req.body.location);
    await createAdminNotification('KPK', searchValue, results, req.body.location);
    res.json({ success: true, found: true, data: results, source: 'external' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// AJK - CNIC or Registration No
router.post('/ajk', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) return res.status(400).json({ success: false, message: 'Search type and value required' });
    if (searchType !== 'registration' && searchType !== 'cnic') {
      return res.status(400).json({ success: false, message: 'AJK search only supports Registration or CNIC' });
    }

    const query = cleanSearchValue(searchType, searchValue);
    const response = await fetch(`https://cplc.sindhpolice.excise.live/API/ajk-vehicle.php?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`AJK API failed with status ${response.status}`);
    const payload = await response.json();
    const vehicles = Array.isArray(payload) ? payload.map(stripVehicleImage).map((v) => mapExternalRecord(v, 'ajk', {
      registrationNo: 'reg_no',
      ownerName: 'owner_name',
      ownerCnic: 'cnic',
      ownerAddress: 'address',
      chassisNo: 'chassis_no',
      engineNo: 'engine_no',
      vehicleMake: 'make',
      vehicleModel: 'model',
      vehicleType: 'vehicle',
      registrationDate: 'date_of_first_registration',
      vehicleStatus: 'vehicle_category',
    })).filter(hasVehicleIdentity) : [];

    if (!vehicles.length) {
      const dbVehicle = await VehicleRecord.findOne({ province: 'ajk', [searchType === 'registration' ? 'registrationNo' : 'ownerCnic']: query });
      await logSearch(req.user._id, req.user.name, 'AJK', searchType, searchValue, dbVehicle || null, req.body.location);
      await createAdminNotification('AJK', searchValue, dbVehicle || null, req.body.location);
      const result = dbVehicle ? await markResultsAsStolen(dbVehicle) : null;
      return res.json({ success: true, found: !!result, data: result });
    }

    const results = await markResultsAsStolen(vehicles);
    await logSearch(req.user._id, req.user.name, 'AJK', searchType, searchValue, results, req.body.location);
    await createAdminNotification('AJK', searchValue, results, req.body.location);
    res.json({ success: true, found: true, data: results, source: 'external' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Balochistan - Registration No + District
router.post('/balochistan', async (req, res) => {
  try {
    const { registrationNo, district } = req.body;
    if (!registrationNo || !district) return res.status(400).json({ success: false, message: 'Registration number and district required' });
    const districtId = getBalochistanDistrictId(district);
    if (!districtId) return res.status(400).json({ success: false, message: 'Invalid Balochistan district' });

    const query = registrationNo.toUpperCase().replace(/\s/g, '');
    const url = `https://vehicleverificationsystem.com/api/blochexcise.php?regNo=${encodeURIComponent(query)}&districtid=${encodeURIComponent(districtId)}`;
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Balochistan API failed with status ${response.status}`);
    const payload = await response.json();
    let vehicle = null;

    if (payload?.records) {
      const record = stripVehicleImage(payload.records);
      vehicle = mapExternalRecord(record, 'balochistan', {
        registrationNo: 'registration_no',
        district: 'district',
        vehicleMake: 'make',
        ownerName: 'ownerName',
        ownerCnic: 'cnic',
        vehicleType: 'categoryOfVehicle',
        engineNo: 'engineNumber',
        engineCapacity: 'engineCC',
        registrationDate: 'registrationDate',
      });
    }

    if (!vehicle) {
      vehicle = await VehicleRecord.findOne({
        province: 'balochistan',
        registrationNo: query,
        district: { $regex: String(district), $options: 'i' },
      });
    }

    const result = vehicle ? await markResultsAsStolen(vehicle) : null;
    await logSearch(req.user._id, req.user.name, 'Balochistan', 'Registration+District', `${registrationNo}/${district}`, result || null, req.body.location);
    await createAdminNotification('Balochistan', `${registrationNo}/${district}`, result || null, req.body.location);
    res.json({ success: true, found: !!result, data: result, source: payload?.records ? 'external' : 'database' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const dedupeVehicleRecords = (vehicles) => {
  const seen = new Set();
  return vehicles.filter((vehicle) => {
    const key = [vehicle.registrationNo || '', vehicle.engineNo || '', vehicle.chassisNo || '', vehicle.ownerCnic || ''].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Stolen Vehicles - CNIC, Chassis, Engine, Registration No
router.post('/stolen', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) return res.status(400).json({ success: false, message: 'Search type and value required' });
    const query = cleanSearchValue(searchType, searchValue);
    const queryMap = {
      registration: { registrationNo: query },
      cnic: { ownerCnic: query },
      chassis: { chassisNo: query },
      engine: { engineNo: query },
    };

    const response = await fetch(`https://vehicleverificationsystem.com/api/stolenveh.php?tracevehicle=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Stolen API failed with status ${response.status}`);
    const payload = await response.json();
    const externalVehicles = Array.isArray(payload?.records)
      ? payload.records.map(stripVehicleImage).map((v) => mapExternalRecord(v, 'stolen', {
          registrationNo: 'registration_no',
          chassisNo: 'chassis_no',
          engineNo: 'engine_no',
          ownerCnic: 'cnic',
          district: 'district',
          ownerName: 'complainant_name',
          vehicleType: 'vehicle',
          vehicleMake: 'incident_type',
          ownerAddress: 'police_station',
        })).filter(hasVehicleIdentity).map((vehicle) => ({ ...vehicle, isStolen: true, status: 'stolen' }))
      : [];

    const dbVehicles = await VehicleRecord.find({ province: 'stolen', isStolen: true, ...queryMap[searchType] });
    const vehicles = dedupeVehicleRecords([...dbVehicles, ...externalVehicles]);
    const results = await markResultsAsStolen(vehicles);
    await logSearch(req.user._id, req.user.name, 'Stolen', searchType, searchValue, results, req.body.location);
    await createAdminNotification('Stolen', searchValue, results, req.body.location);
    res.json({ success: true, found: results.length > 0, data: results, source: 'external' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Non-Custom Vehicles - Chassis or Engine
router.post('/noncustom', async (req, res) => {
  try {
    const { searchType, searchValue } = req.body;
    if (!searchType || !searchValue) return res.status(400).json({ success: false, message: 'Search type and value required' });
    if (!['chassis', 'engine'].includes(searchType)) {
      return res.status(400).json({ success: false, message: 'Non-Custom search only supports Chassis or Engine' });
    }
    const queryMap = {
      chassis: { chassisNo: searchValue.toUpperCase() },
      engine: { engineNo: searchValue.toUpperCase() },
    };
    const vehicles = await VehicleRecord.find({ province: 'noncustom', isNonCustom: true, ...queryMap[searchType] });
    await logSearch(req.user._id, req.user.name, 'Non-Custom', searchType, searchValue, vehicles, req.body.location);
    await createAdminNotification('Non-Custom', searchValue, vehicles, req.body.location);
    res.json({ success: true, found: vehicles.length > 0, data: vehicles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User's own search history
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const logs = await SearchLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await SearchLog.countDocuments({ userId: req.user._id });
    res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
