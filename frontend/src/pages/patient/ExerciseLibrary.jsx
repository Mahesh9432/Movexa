import React, { useState } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

const exerciseCatalog = [
  {
    id: 'LIB-01',
    categoryTag: 'QUADRICEPS & KNEE STABILITY',
    name: 'Terminal Knee Extension (TKE)',
    tutorial: '2:15 tutorial',
    badge: 'AI Posture Tracking Ready',
    routineStatus: "In Today's Routine",
    sets: '3 sets × 12 reps',
    equipment: 'Green Resistance Band',
    equipmentType: 'Band',
    pacingType: 'Controlled',
    tabCategory: 'Knee & Leg (14)',
    description: 'Strengthens the inner thigh (VMO) and stabilizes the kneecap through full terminal range.',
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80',
    bodyPart: 'Knee Joint',
    difficulty: 'Intermediate',
    targetRom: '0° - 90° ROM',
    tempo: '2s Hold • 3s Return',
    instructions: [
      'Loop resistance band around the back of your knee while facing the anchor point.',
      'Step back to create moderate tension with your heel slightly elevated.',
      'Slowly straighten your knee against the band resistance, locking out fully at the top.',
      'Return in a slow, controlled 3-second motion.'
    ],
    precautions: 'Do not allow the knee to snap back quickly under band tension. Stop if sharp pain occurs.'
  },
  {
    id: 'LIB-02',
    categoryTag: 'HIP FLEXORS & QUAD FIRE',
    name: 'Supine Straight Leg Raise (SLR)',
    tutorial: '1:45 tutorial',
    badge: 'Quad Lag & Tilt Detection',
    routineStatus: null,
    sets: '3 sets × 10 reps',
    equipment: 'Bodyweight',
    equipmentType: 'Bodyweight',
    pacingType: 'Hold',
    tabCategory: 'Hip & Mobility (8)',
    description: 'Lying flat, gently lift your straightened leg while keeping your quadriceps fully locked.',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&auto=format&fit=crop&q=80',
    bodyPart: 'Quadriceps / Knee',
    difficulty: 'Beginner',
    targetRom: '0° Full Extension',
    tempo: '10-sec Hold',
    instructions: [
      'Lie on your back with one leg bent and the recovering leg straight.',
      'Tighten your thigh muscle to lock your knee completely straight.',
      'Lift your straight leg about 12 inches off the ground, keeping your toe pointed upward.',
      'Hold briefly at the top and lower slowly.'
    ],
    precautions: 'Keep toes pointing straight upward toward the ceiling throughout the hold.'
  },
  {
    id: 'LIB-03',
    categoryTag: 'HAMSTRINGS & POSTERIOR CHAIN',
    name: 'Prone Hamstring Curl',
    tutorial: '2:00 tutorial',
    badge: '85° ROM Angle Guard',
    routineStatus: null,
    sets: '2 sets × 15 reps',
    equipment: 'Yellow Band (Light)',
    equipmentType: 'Band',
    pacingType: 'Controlled',
    tabCategory: 'Knee & Leg (14)',
    description: 'Bend your heel smoothly towards your glutes against light resistance to rebuild hamstring flexion.',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&auto=format&fit=crop&q=80',
    bodyPart: 'Hamstrings',
    difficulty: 'Intermediate',
    targetRom: '0° - 90° Flexion',
    tempo: '2s Hold • 2s Return',
    instructions: [
      'Lie face down with a light resistance band secured around your ankle.',
      'Bend your knee to pull your heel toward your glutes in a controlled movement.',
      'Lower your leg slowly back down to starting position.'
    ],
    precautions: 'Avoid lifting your hips off the mat during the curl.'
  },
  {
    id: 'LIB-04',
    categoryTag: 'VMO & JOINT DECOMPRESSION',
    name: 'Isometric Quad Sets with Towel',
    tutorial: '1:30 tutorial',
    badge: 'Muscle Contraction Timer',
    routineStatus: 'Recommended by Dr. Vance',
    sets: '3 sets × 10 reps (5s hold)',
    equipment: 'Rolled Towel',
    equipmentType: 'Bodyweight',
    pacingType: 'Hold',
    tabCategory: 'Knee & Leg (14)',
    description: 'Press the back of your knee down into a small rolled towel to activate the quadriceps safely.',
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80',
    bodyPart: 'Knee Joint',
    difficulty: 'Beginner',
    targetRom: '0° Full Extension',
    tempo: '5s Hold',
    instructions: [
      'Sit or lie flat with legs straight and towel roll under knee.',
      'Push back of knee downward into the towel.',
      'Hold for 5 seconds and release.'
    ],
    precautions: 'Keep breathing normally throughout the isometric contraction.'
  },
  {
    id: 'LIB-05',
    categoryTag: 'KNEE FLEXION & RANGE OF MOTION',
    name: 'Seated Heel Slides',
    tutorial: '1:50 tutorial',
    badge: 'Flexion Arc Tracking',
    routineStatus: null,
    sets: '2 sets × 10 reps',
    equipment: 'Low-Friction Sock / Strap',
    equipmentType: 'Bodyweight',
    pacingType: 'Controlled',
    tabCategory: 'Hip & Mobility (8)',
    description: 'Slide your heel toward your buttocks to gently restore knee flexion following surgery.',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&auto=format&fit=crop&q=80',
    bodyPart: 'Knee Joint',
    difficulty: 'Beginner',
    targetRom: '0° - 110° ROM',
    tempo: 'Controlled Glide',
    instructions: [
      'Sit on a firm surface or bed with legs extended.',
      'Slowly slide your heel toward your hips, bending the knee as far as comfortable.',
      'Return to starting position.'
    ],
    precautions: 'Do not force beyond mild stretching discomfort.'
  },
  {
    id: 'LIB-06',
    categoryTag: 'GASTROCNEMIUS & ANKLE MOBILITY',
    name: 'Standing Calf Raises & Pumps',
    tutorial: '1:15 tutorial',
    badge: 'Cadence & Balance Tracker',
    routineStatus: null,
    sets: '2 sets × 15 reps',
    equipment: 'Wall Support',
    equipmentType: 'Bodyweight',
    pacingType: 'Controlled',
    tabCategory: 'Core & Balance (7)',
    description: 'Rise onto the balls of your feet using a wall for balance to restore lower leg circulation.',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&auto=format&fit=crop&q=80',
    bodyPart: 'Calves & Ankle',
    difficulty: 'Beginner',
    targetRom: 'Full Plantarflexion',
    tempo: '2s Up • 2s Down',
    instructions: [
      'Stand facing a wall with hands resting for support.',
      'Rise up onto your toes as high as possible.',
      'Lower heels back down slowly to the floor.'
    ],
    precautions: 'Maintain steady balance using the wall support.'
  }
];

export default function ExerciseLibrary({ onLogout, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Exercises (34)');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [pacingFilter, setPacingFilter] = useState('All');
  const [activeExercise, setActiveExercise] = useState(null);

  const tabs = ['All Exercises (34)', 'My Prescribed (3)', 'Knee & Leg (14)', 'Hip & Mobility (8)', 'Core & Balance (7)', 'Stretching'];

  // Combined filtering for search query, category tabs, equipment, and pacing dropdowns
  const filteredExercises = exerciseCatalog.filter((ex) => {
    const matchesSearch = 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ex.categoryTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab.startsWith('All Exercises') || 
      (activeTab.startsWith('My Prescribed') && ex.routineStatus) ||
      ex.tabCategory === activeTab;

    const matchesEquipment = 
      equipmentFilter === 'All' || 
      ex.equipmentType === equipmentFilter;

    const matchesPacing = 
      pacingFilter === 'All' || 
      ex.pacingType === pacingFilter;

    return matchesSearch && matchesTab && matchesEquipment && matchesPacing;
  });

  return (
    <PatientLayout currentView="library" onLogout={onLogout} onNavigate={onNavigate}>
      {/* TOP CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#D9E3ED] p-3.5 rounded-2xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3.5 top-3 text-gray-400 text-xs">🔍</span>
          <input 
            type="text" 
            placeholder="Search exercises by name, body part, or recovery goal..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F7FB] border border-[#D9E3ED] pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-[#193B62] focus:outline-none focus:border-[#087F73]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl text-xs font-semibold text-[#193B62]">
            <span className="text-gray-400">Equipment:</span>
            <select 
              value={equipmentFilter} 
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-[#193B62] cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Band">Resistance Band</option>
              <option value="Bodyweight">Bodyweight</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F4F7FB] border border-[#D9E3ED] px-3 py-2 rounded-xl text-xs font-semibold text-[#193B62]">
            <span className="text-gray-400">Pacing:</span>
            <select 
              value={pacingFilter} 
              onChange={(e) => setPacingFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-[#193B62] cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Controlled">Controlled Tempo</option>
              <option value="Hold">Hold / Isometric</option>
            </select>
          </div>

          <button 
            onClick={() => { setSearchQuery(''); setEquipmentFilter('All'); setPacingFilter('All'); setActiveTab('All Exercises (34)'); }}
            className="text-xs font-bold text-gray-500 hover:text-[#193B62] px-2 py-1 cursor-pointer"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* HORIZONTAL CATEGORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[#193B62] text-white shadow-xs'
                : 'bg-white border border-[#D9E3ED] text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* EXERCISE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExercises.length > 0 ? (
          filteredExercises.map((ex) => (
            <div 
              key={ex.id}
              className="bg-white border border-[#D9E3ED] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* CARD MEDIA THUMBNAIL */}
                <div className="relative h-44 bg-gray-900 overflow-hidden">
                  <img src={ex.thumbnail} alt={ex.name} className="w-full h-full object-cover opacity-80" />
                  
                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {ex.routineStatus && (
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {ex.routineStatus}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded-md flex items-center gap-1">
                    <span>▶</span> {ex.tutorial}
                  </div>

                  {/* Center Play Button Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={() => setActiveExercise(ex)}
                      className="w-10 h-10 rounded-full bg-white/90 text-[#193B62] flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Bottom Media Bar Tag */}
                  <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {ex.badge}
                  </div>
                </div>

                {/* CARD CONTENT */}
                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
                      {ex.categoryTag}
                    </p>
                    <h3 className="text-base font-bold text-[#193B62] mt-0.5">
                      {ex.name}
                    </h3>
                  </div>

                  {/* SETS & EQUIPMENT METRICS */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F4F7FB] p-2.5 rounded-xl border border-[#D9E3ED] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">📐</span>
                      <strong className="text-[#193B62] font-semibold">{ex.sets}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">⚡</span>
                      <strong className="text-[#193B62] font-semibold">{ex.equipment}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {ex.description}
                  </p>
                </div>
              </div>

              {/* CARD FOOTER BUTTONS */}
              <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex items-center gap-2">
                <button 
                  onClick={() => onNavigate('session')}
                  className="flex-1 bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs text-center"
                >
                  🤖 Practice with AI
                </button>
                <button 
                  onClick={() => setActiveExercise(ex)}
                  className="bg-white border border-[#D9E3ED] hover:bg-gray-50 text-[#193B62] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  📖 Guide
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-[#D9E3ED] rounded-2xl p-10 text-center text-xs text-gray-500 shadow-xs">
            No exercises found matching your search or filter criteria.
          </div>
        )}
      </div>

      {/* EXERCISE DETAIL MODAL */}
      <Modal isOpen={!!activeExercise} onClose={() => setActiveExercise(null)} title={activeExercise?.name}>
        {activeExercise && (
          <div className="space-y-4 text-xs">
            <img src={activeExercise.thumbnail} alt={activeExercise.name} className="w-full h-48 rounded-xl object-cover border border-[#D9E3ED]" />
            
            <div className="grid grid-cols-3 gap-2 bg-[#F4F7FB] p-3 rounded-xl border border-[#D9E3ED]">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Volume</span>
                <strong className="text-[#193B62]">{activeExercise.sets}</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Target ROM</span>
                <strong className="text-[#087F73]">{activeExercise.targetRom}</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Tempo</span>
                <strong className="text-[#193B62]">{activeExercise.tempo}</strong>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-[#193B62]">Clinical Overview</h4>
              <p className="text-gray-600 leading-relaxed">{activeExercise.description}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#D9E3ED]">
              <h4 className="font-bold text-[#193B62]">Step-by-Step Instructions</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                {activeExercise.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl space-y-0.5">
              <p className="font-bold">⚠️ Safety Precaution</p>
              <p className="text-[11px]">{activeExercise.precautions}</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setActiveExercise(null)}
                className="px-5 py-2.5 border border-[#D9E3ED] rounded-xl font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => { setActiveExercise(null); onNavigate('session'); }}
                className="bg-[#087F73] text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Start with AI →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PatientLayout>
  );
}