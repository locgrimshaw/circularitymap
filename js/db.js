// =====================================================
// db.js — Supabase configuration & data access layer
// =====================================================
//
// HOW TO SET UP YOUR DATABASE (one-time, ~5 minutes):
//
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project (note your project URL and anon key)
// 3. Go to the SQL Editor in your Supabase dashboard
// 4. Run the contents of setup/schema.sql to create the table
// 5. Run the contents of setup/seed.sql to insert the starter data
// 6. Replace the two config values below with your own
// 7. That's it — the site will now read/write from your database
//
// For GitHub Pages, you can safely commit the ANON key (it is
// designed to be public). Row-level security is set so that
// anyone can INSERT and SELECT, but not DELETE or UPDATE.
//
// =====================================================

const DB_CONFIG = {
  url: "https://cpufxkgcysicscurcowg.supabase.co/rest/v1/",          // e.g. https://abcdefgh.supabase.co
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdWZ4a2djeXNpY3NjdXJjb3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MzIzMzAsImV4cCI6MjA5NjIwODMzMH0.WYqv5PaP11KqXrH6gQIZP4dfFdVNAcmtk4HuHG5jMK0"  // long JWT string from Project Settings → API
};

// ---- Internal helpers ----

function isConfigured() {
  return (
    DB_CONFIG.url !== "YOUR_SUPABASE_URL" &&
    DB_CONFIG.anonKey !== "YOUR_SUPABASE_ANON_KEY"
  );
}

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${DB_CONFIG.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": DB_CONFIG.anonKey,
      "Authorization": `Bearer ${DB_CONFIG.anonKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error (${res.status}): ${err}`);
  }
  // 204 No Content
  if (res.status === 204) return [];
  return res.json();
}

// ---- Public API ----

/**
 * Fetch all directory entries, ordered newest first.
 * Falls back to the bundled seed data if Supabase is not configured.
 */
async function fetchEntries() {
  if (!isConfigured()) {
    console.warn("Supabase not configured — using bundled seed data (read-only mode).");
    return SEED_DATA;
  }
  const rows = await supabaseFetch("entries?select=*&order=created_at.desc");
  return rows.map(r => ({ ...r, desc: r.description ?? r.desc }));
}

/**
 * Insert a new directory entry.
 * Returns the saved entry (with its server-assigned id).
 */
async function insertEntry(entry) {
  if (!isConfigured()) {
    // In unconfigured mode, just fake a local insert so the UI still works
    const fake = { ...entry, id: Date.now(), created_at: new Date().toISOString() };
    SEED_DATA.unshift(fake);
    return fake;
  }
  // Map JS 'desc' property to DB column 'description'
  const { desc, ...rest } = entry;
  const rows = await supabaseFetch("entries", {
    method: "POST",
    body: JSON.stringify({ ...rest, description: desc })
  });
  // Map back so the rest of the app can use 'desc'
  const saved = rows[0];
  if (saved && saved.description && !saved.desc) saved.desc = saved.description;
  return saved;
}

export { fetchEntries, insertEntry, isConfigured };

// =====================================================
// SEED DATA — 60 real London circular economy entries
// This is used as a fallback before Supabase is set up,
// and also lives in setup/seed.sql for DB population.
// =====================================================

const SEED_DATA = [
  { id: 1, name: "Library of Things", category: "community", website: "https://libraryofthings.co.uk", location: "Crystal Palace", lat: 51.4200, lng: -0.0700, photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600", desc: "A community space to borrow useful items affordably." },
  { id: 2, name: "Oddbox", category: "startup", website: "https://oddbox.co.uk", location: "Vauxhall", lat: 51.4862, lng: -0.1228, photo: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600", desc: "Rescuing surplus fruit and veg directly from farms." },
  { id: 3, name: "The Restart Project", category: "skills", website: "https://therestartproject.org", location: "Camden", lat: 51.5390, lng: -0.1426, photo: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600", desc: "Helping people fix their own electronics to reduce e-waste." },
  { id: 4, name: "ReLondon", category: "education", website: "https://relondon.gov.uk", location: "Shoreditch", lat: 51.5255, lng: -0.0792, photo: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15e?auto=format&fit=crop&w=600", desc: "Partnership to improve waste and resource management." },
  { id: 5, name: "Olio", category: "startup", website: "https://olioex.com", location: "Clerkenwell", lat: 51.5230, lng: -0.1060, photo: "https://images.unsplash.com/photo-1593510987185-1ec2256148a3?auto=format&fit=crop&w=600", desc: "Local sharing app connecting neighbors to give away spare food." },
  { id: 6, name: "Too Good To Go", category: "startup", website: "https://toogoodtogo.co.uk", location: "London", lat: 51.5074, lng: -0.1278, photo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600", desc: "App fighting food waste by connecting you to stores with surplus food." },
  { id: 7, name: "TRAID", category: "shop", website: "https://traid.org.uk", location: "Dalston", lat: 51.5471, lng: -0.0754, photo: "https://images.unsplash.com/photo-1525004443085-f8658a52ee2c?auto=format&fit=crop&w=600", desc: "Charity turning clothes waste into funds to stop sweatshops." },
  { id: 8, name: "Choose Love Shop", category: "shop", website: "https://choose.love", location: "Soho", lat: 51.5136, lng: -0.1365, photo: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb8?auto=format&fit=crop&w=600", desc: "World's first store that sells real products for refugees." },
  { id: 9, name: "Hubbub", category: "community", website: "https://hubbub.org.uk", location: "Somerset House", lat: 51.5110, lng: -0.1171, photo: "https://images.unsplash.com/photo-1551025528-76906a5e1281?auto=format&fit=crop&w=600", desc: "Charity creating environmental campaigns with a difference." },
  { id: 10, name: "Beyond Retro", category: "shop", website: "https://beyondretro.com", location: "Brick Lane", lat: 51.5226, lng: -0.0718, photo: "https://images.unsplash.com/photo-1489987707023-afc7e5fcb7c4?auto=format&fit=crop&w=600", desc: "Leading vintage clothing retailer championing circular fashion." },
  { id: 11, name: "Remakery", category: "skills", website: "https://remakery.org", location: "Brixton", lat: 51.4682, lng: -0.1065, photo: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=600", desc: "Co-operative maker space fostering the creation of products from waste." },
  { id: 12, name: "Blackhorse Workshop", category: "skills", website: "https://blackhorseworkshop.co.uk", location: "Walthamstow", lat: 51.5878, lng: -0.0435, photo: "https://images.unsplash.com/photo-1565511029273-049836371607?auto=format&fit=crop&w=600", desc: "Public workshop offering wood and metalworking facilities." },
  { id: 13, name: "Building BloQs", category: "skills", website: "https://buildingbloqs.com", location: "Enfield", lat: 51.6139, lng: -0.0381, photo: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=600", desc: "London's largest open access workshop space." },
  { id: 14, name: "The Felix Project", category: "community", website: "https://thefelixproject.org", location: "Park Royal", lat: 51.5303, lng: -0.2707, photo: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600", desc: "Rescuing surplus food and delivering it to charities and schools." },
  { id: 15, name: "City Harvest", category: "community", website: "https://cityharvest.org.uk", location: "Acton", lat: 51.5173, lng: -0.2631, photo: "https://images.unsplash.com/photo-1505935428862-770b6f24f629?auto=format&fit=crop&w=600", desc: "Redistributing surplus food to people facing food poverty." },
  { id: 16, name: "Hackney School of Food", category: "education", website: "https://hackneyschooloffood.com", location: "Hackney", lat: 51.5544, lng: -0.0371, photo: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600", desc: "Teaching chefs of all ages about growing and cooking food." },
  { id: 17, name: "UCL Circular Economy Lab", category: "education", website: "https://ucl.ac.uk", location: "Bloomsbury", lat: 51.5246, lng: -0.1340, photo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600", desc: "Research hub for circular economy design and systems." },
  { id: 18, name: "Ellen MacArthur Foundation", category: "education", website: "https://ellenmacarthurfoundation.org", location: "London", lat: 51.5072, lng: -0.1276, photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600", desc: "Charity committed to creating a circular economy." },
  { id: 19, name: "Boutique by Shelter", category: "shop", website: "https://shelter.org.uk", location: "King's Cross", lat: 51.5346, lng: -0.1219, photo: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=600", desc: "Premium charity shop selling high-quality donated goods." },
  { id: 20, name: "Depop", category: "startup", website: "https://depop.com", location: "Farringdon", lat: 51.5204, lng: -0.1049, photo: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600", desc: "Peer-to-peer social e-commerce company for fashion." },
  { id: 21, name: "Vinted", category: "startup", website: "https://vinted.co.uk", location: "Tech City", lat: 51.5255, lng: -0.0875, photo: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600", desc: "Online marketplace for buying, selling and exchanging new or secondhand items." },
  { id: 22, name: "Dizzie", category: "startup", website: "https://getdizzie.com", location: "Wandsworth", lat: 51.4571, lng: -0.1914, photo: "https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?auto=format&fit=crop&w=600", desc: "Zero-waste grocery delivery service in reusable pots." },
  { id: 23, name: "Clubzerø", category: "startup", website: "https://clubzero.co", location: "Shoreditch", lat: 51.5240, lng: -0.0760, photo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600", desc: "Returnable packaging system for food and beverage." },
  { id: 24, name: "Notpla", category: "startup", website: "https://notpla.com", location: "Hackney Wick", lat: 51.5434, lng: -0.0232, photo: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600", desc: "Creating advanced packaging solutions made from seaweed." },
  { id: 25, name: "Reboxed", category: "startup", website: "https://reboxed.co", location: "Southwark", lat: 51.5034, lng: -0.0988, photo: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600", desc: "Buy, sell and swap premium refurbished tech." },
  { id: 26, name: "HURR", category: "startup", website: "https://hurrcollective.com", location: "Oxford Circus", lat: 51.5153, lng: -0.1419, photo: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600", desc: "The UK's leading wardrobe rental platform." },
  { id: 27, name: "By Rotation", category: "startup", website: "https://byrotation.com", location: "Marylebone", lat: 51.5186, lng: -0.1539, photo: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600", desc: "Social fashion rental app." },
  { id: 28, name: "DabbaDrop", category: "startup", website: "https://dabbadrop.co.uk", location: "Hackney", lat: 51.5450, lng: -0.0553, photo: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600", desc: "Zero-waste takeaway delivered in reusable tiffin tins." },
  { id: 29, name: "Ecover Refill", category: "shop", website: "https://ecover.com", location: "Kensington", lat: 51.5014, lng: -0.1910, photo: "https://images.unsplash.com/photo-1610052737525-4c6fdf1640a4?auto=format&fit=crop&w=600", desc: "Refill stations for household cleaning products." },
  { id: 30, name: "Planet Organic Refill", category: "shop", website: "https://planetorganic.com", location: "Islington", lat: 51.5362, lng: -0.1030, photo: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600", desc: "Organic supermarket with extensive packaging-free zones." },
  { id: 31, name: "The Good Store", category: "shop", website: "https://thegoodstore.uk", location: "Southwark", lat: 51.5020, lng: -0.0980, photo: "https://images.unsplash.com/photo-1558864559-ed673ba3610b?auto=format&fit=crop&w=600", desc: "Department store dedicated to sustainable products." },
  { id: 32, name: "Fara Charity Shop", category: "shop", website: "https://faracharity.org", location: "Islington", lat: 51.5380, lng: -0.1035, photo: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=600", desc: "Funding programs for vulnerable children through reuse." },
  { id: 33, name: "Oxfam Boutique", category: "shop", website: "https://oxfam.org.uk", location: "Chelsea", lat: 51.4875, lng: -0.1685, photo: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=600", desc: "Curated pre-loved fashion supporting global poverty relief." },
  { id: 34, name: "Aida Shoreditch", category: "shop", website: "https://aidashoreditch.co.uk", location: "Shoreditch", lat: 51.5265, lng: -0.0775, photo: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600", desc: "Independent store focusing on sustainable brands." },
  { id: 35, name: "The Bike Project", category: "community", website: "https://thebikeproject.co.uk", location: "Deptford", lat: 51.4785, lng: -0.0245, photo: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600", desc: "Refurbishing secondhand bikes and giving them to refugees." },
  { id: 36, name: "Emmaus", category: "community", website: "https://emmaus.org.uk", location: "Greenwich", lat: 51.4826, lng: 0.0077, photo: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=600", desc: "Community supporting formerly homeless people through upcycling." },
  { id: 37, name: "Transition Town", category: "community", website: "https://transitionnetwork.org", location: "Tooting", lat: 51.4275, lng: -0.1668, photo: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=600", desc: "Grassroots community initiative building local resilience." },
  { id: 38, name: "Little Village", category: "community", website: "https://littlevillagehq.org", location: "Wandsworth", lat: 51.4575, lng: -0.1920, photo: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600", desc: "A 'baby bank' collecting great quality donated clothes and equipment." },
  { id: 39, name: "Bankside Open Spaces", category: "community", website: "https://bost.org.uk", location: "Southwark", lat: 51.5035, lng: -0.0950, photo: "https://images.unsplash.com/photo-1584347712867-0db79f64923e?auto=format&fit=crop&w=600", desc: "Protecting, preserving and enhancing parks and gardens." },
  { id: 40, name: "Fabrications", category: "skills", website: "https://fabrications1.co.uk", location: "Hackney", lat: 51.5365, lng: -0.0765, photo: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=600", desc: "Textile upcycling studio and retail space." },
  { id: 41, name: "Makerversity", category: "skills", website: "https://makerversity.org", location: "Somerset House", lat: 51.5112, lng: -0.1175, photo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600", desc: "Pioneering community of maker businesses." },
  { id: 42, name: "The Good Wardrobe", category: "skills", website: "https://thegoodwardrobe.com", location: "London", lat: 51.5074, lng: -0.1278, photo: "https://images.unsplash.com/photo-1558769132-cb1fac0840c2?auto=format&fit=crop&w=600", desc: "Online hub promoting long-life fashion." },
  { id: 43, name: "CSM Biodesign", category: "education", website: "https://arts.ac.uk", location: "King's Cross", lat: 51.5355, lng: -0.1245, photo: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600", desc: "Integrating biology and design for a circular future." },
  { id: 44, name: "Grantham Institute", category: "education", website: "https://imperial.ac.uk", location: "South Kensington", lat: 51.4988, lng: -0.1749, photo: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600", desc: "Driving climate change and environment research." },
  { id: 45, name: "Institute of Making", category: "education", website: "https://instituteofmaking.org.uk", location: "Bloomsbury", lat: 51.5240, lng: -0.1330, photo: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600", desc: "Multidisciplinary research club for material obsession." },
  { id: 46, name: "FareShare", category: "community", website: "https://fareshare.org.uk", location: "Deptford", lat: 51.4800, lng: -0.0250, photo: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600", desc: "UK's national network of charitable food redistributors." },
  { id: 47, name: "Brixton Pound", category: "community", website: "https://brixtonpound.org", location: "Brixton", lat: 51.4630, lng: -0.1150, photo: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600", desc: "Local currency promoting local business and community resilience." },
  { id: 48, name: "Ecosia London", category: "startup", website: "https://ecosia.org", location: "Old Street", lat: 51.5250, lng: -0.0880, photo: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600", desc: "The search engine that plants trees, London hub." },
  { id: 49, name: "Raye the Store", category: "shop", website: "https://weare-raye.com", location: "Covent Garden", lat: 51.5130, lng: -0.1240, photo: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600", desc: "Pop-up platform for emerging sustainable brands." },
  { id: 50, name: "Community Fridge", category: "community", website: "https://hubbub.org.uk", location: "Poplar", lat: 51.5085, lng: -0.0165, photo: "https://images.unsplash.com/photo-1584263347416-85a696b4eda7?auto=format&fit=crop&w=600", desc: "Public fridge where anyone can leave or take surplus food." },
  { id: 51, name: "London Hackspace", category: "skills", website: "https://london.hackspace.org.uk", location: "Wembley", lat: 51.5564, lng: -0.2974, photo: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600", desc: "A non-profit hacker space and community-run workshop." },
  { id: 52, name: "South London Makerspace", category: "skills", website: "https://southlondonmakerspace.org", location: "Herne Hill", lat: 51.4526, lng: -0.0984, photo: "https://images.unsplash.com/photo-1581092921461-7d3127887372?auto=format&fit=crop&w=600", desc: "Community-run workshop allowing members to make, learn and share." },
  { id: 53, name: "Fixing Factory", category: "skills", website: "https://fixingfactory.org", location: "Camden", lat: 51.5458, lng: -0.1413, photo: "https://images.unsplash.com/photo-1605481710534-7db3dfaef3d9?auto=format&fit=crop&w=600", desc: "Community fixing hub extending the life of household appliances." },
  { id: 54, name: "Richmond MakerLabs", category: "skills", website: "https://richmondmakerlabs.uk", location: "Richmond", lat: 51.4645, lng: -0.3013, photo: "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&w=600", desc: "Open community workshop promoting tinkering and repairing." },
  { id: 55, name: "The Create Place", category: "community", website: "https://stmargaretshouse.org.uk", location: "Bethnal Green", lat: 51.5283, lng: -0.0528, photo: "https://images.unsplash.com/photo-1501048600171-873d6b1d1209?auto=format&fit=crop&w=600", desc: "Community arts and craft space focusing on textile reuse and mending." },
  { id: 56, name: "Forest Recycling Project", category: "community", website: "https://frpuk.org", location: "Walthamstow", lat: 51.5796, lng: -0.0163, photo: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15e?auto=format&fit=crop&w=600", desc: "Environmental charity diverting paint, wood and paper from landfill." },
  { id: 57, name: "Hackney City Farm Repair Cafe", category: "skills", website: "https://hackneycityfarm.co.uk", location: "Hackney", lat: 51.5323, lng: -0.0664, photo: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600", desc: "Monthly repair sessions for bikes, clothes and small electronics." },
  { id: 58, name: "Fast Fashion Therapy", category: "skills", website: "https://fastfashiontherapy.co.uk", location: "Islington", lat: 51.5362, lng: -0.1030, photo: "https://images.unsplash.com/photo-1584989659089-f5386f68cce8?auto=format&fit=crop&w=600", desc: "Workshops offering sewing machine access to repair and upcycle clothing." },
  { id: 59, name: "Mend Assembly", category: "shop", website: "https://mendassembly.com", location: "London", lat: 51.5145, lng: -0.1444, photo: "https://images.unsplash.com/photo-1558769132-cb1fac0840c2?auto=format&fit=crop&w=600", desc: "Professional garment repair and alteration promoting circular fashion." },
  { id: 60, name: "Goldfinger", category: "skills", website: "https://goldfinger.design", location: "Trellick Tower", lat: 51.5235, lng: -0.2078, photo: "https://images.unsplash.com/photo-1565511029273-049836371607?auto=format&fit=crop&w=600", desc: "Social enterprise crafting bespoke furniture from reclaimed materials." }
];
