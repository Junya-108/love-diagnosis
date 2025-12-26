function App() {
  return <h1>変わったら成功</h1>
}
export default App


function App() {
  return (
    <>
      <div className="header">
        <div className="logo">
          <div className="logo-icon">♡</div>
          VALUE MATCHER
        </div>
        <div className="live">LIVE MODE</div>
      </div>

      <div className="container">
        <div className="hero">
          <div className="hero-icon">♡</div>
          <div className="hero-title">
            恋愛価値観・本音深層診断 50
          </div>
          <div className="hero-text">
            全50問の精密テストで、あなたの恋愛のクセや、
            心の奥に隠した本当の願望を浮き彫りにします。
          </div>

          <button className="primary-btn">
            診断を開始する
          </button>
        </div>
      </div>
    </>
  )
}

export default App
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { Heart, ChevronRight, Eye, Lock, BarChart3 } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDVUC7uEaN8ckAuCIsK41ejh3ldJOQH6uc",
  authDomain: "love-diagnosis-2197b.firebaseapp.com",
  projectId: "love-diagnosis-2197b",
  storageBucket: "love-diagnosis-2197b.firebasestorage.app",
  messagingSenderId: "281811319236",
  appId: "1:281811319236:web:1e418333bf0adae7a00c91"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'love-diagnosis-50-questions';

const QUESTIONS = [
  { id: 'q1', category: '距離感', text: '恋人とは、できるだけ毎日・頻繁に連絡を取り合いたい？', options: ['非常にそう思う', 'そう思う', 'どちらとも言えない', 'あまり思わない', '全く思わない'] },
  { id: 'q2', category: '距離感', text: '自分一人の時間は、何よりも絶対に必要なものだと感じる？', options: ['非常に必要', '必要', 'どちらとも言えない', 'あまり必要ない', '全く必要ない'] },
  { id: 'q3', category: '依存', text: '「恋人に依存しすぎているかも」と自分で不安になることはある？', options: ['非常にある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q4', category: '束縛', text: '相手に束縛されることは、かなりのストレスに感じる？', options: ['非常にストレス', 'ストレス', 'どちらとも言えない', 'あまり感じない', '全く感じない'] },
  { id: 'q5', category: '距離感', text: '「相手に放置されている」と感じて寂しくなることは多い？', options: ['非常に多い', '多い', '時々ある', 'あまりない', '全くない'] },
  { id: 'q6', category: '安心感', text: '恋愛において、相手に「安心感」を求める気持ちは強いほうだ？', options: ['非常に強い', '強い', '普通', 'あまりない', '全くない'] },
  { id: 'q7', category: '優先度', text: '自分の生活の中で、恋愛の優先順位はかなり高いほうだと思う？', options: ['非常に高い', '高い', '普通', 'あまり高くない', '低め'] },
  { id: 'q8', category: '期待', text: '「恋人ならこうしてほしい」という期待をつい抱いてしまう？', options: ['非常にある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q9', category: '我慢', text: '二人の関係のために、自分が我慢をすることは多いと感じる？', options: ['非常に多い', '多い', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q10', category: '不満', text: '今の恋人（または理想）との距離感に不満を感じることはある？', options: ['非常にある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q11', category: '不安', text: '相手からの返信が遅いと、何か悪いことをしたか不安になる？', options: ['非常に不安', '不安', '少し気になる', 'あまり気にならない', '全く気にならない'] },
  { id: 'q12', category: '本音', text: '本音を言いたくても、言えずに自分の中に飲み込んでしまう？', options: ['非常によくある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q13', category: '対話', text: 'ケンカをした時こそ、逃げずに徹底的に話し合いたい？', options: ['非常に強い', '強い', 'どちらでもいい', 'あまり思わない', '避けたい'] },
  { id: 'q14', category: '察して', text: '言葉にしなくても、自分の気持ちを「察してほしい」と思う？', options: ['常にそう思う', 'よく思う', 'たまに思う', 'あまり思わない', '思わない'] },
  { id: 'q15', category: '遠慮', text: '相手に嫌われないよう、気を遣いすぎてしまう自覚がある？', options: ['非常にある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q16', category: '自信', text: '嫌なことを「嫌だ」と相手にはっきり言える自信がある？', options: ['非常にある', 'ある', 'どちらとも言えない', 'あまりない', '全くない'] },
  { id: 'q17', category: '冗談', text: '相手に冗談で言われたことでも、内心ずっと引きずってしまう？', options: ['非常によくある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q18', category: '理解', text: '「言わなくても分かってほしい」という甘えのような気持ちがある？', options: ['非常に強い', '強い', '少しある', 'あまりない', '全くない'] },
  { id: 'q19', category: '対話', text: '揉め事になりそうな時、話し合いを避けたいと感じることはある？', options: ['非常に多い', '多い', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q20', category: '表現', text: '自分の素直な気持ちを言葉にして伝えるのは得意なほうだ？', options: ['非常に得意', '得意', '普通', '苦手', '非常に苦手'] },
  { id: 'q21', category: '自己開示', text: '恋人の前で、弱い自分や情けない自分をさらけ出せる？', options: ['いつでも出せる', '出せる', '相手による', 'あまり出せない', '絶対出せない'] },
  { id: 'q22', category: '不安', text: '悩みや不安があっても、一人で抱え込んでしまうことが多い？', options: ['非常に多い', '多い', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q23', category: '無理', text: '嫌われるのが怖くて、無理をして相手に合わせてしまう？', options: ['非常によくある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q24', category: '比較', text: 'ぶっちゃけ、今の恋人は歴代の好きな人の中で何番目くらい？', options: ['ダントツで1番目', '2番目くらい', '3〜5番目くらい', 'あまり上位ではない', '比べられない'] },
  { id: 'q25', category: '支え', text: '落ち込んだ時、一番に恋人を頼りたいという気持ちは強い？', options: ['非常に強い', '強い', '普通', 'あまりない', '全くない'] },
  { id: 'q26', category: '自信', text: '恋愛において、自分に自信が持てないと感じる頻度は高い？', options: ['非常に高い', '高い', 'たまにある', 'あまりない', '自信満々'] },
  { id: 'q27', category: '隠し事', text: '波風を立てたくなくて、恋人に本音を隠すことはよくある？', options: ['非常にある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q28', category: '感情', text: '自分の喜怒哀楽を、相手の前で抑え込んでしまうほうだ？', options: ['常に抑える', 'よく抑える', '時々ある', 'あまりない', '素直に出す'] },
  { id: 'q29', category: '孤独', text: '一緒にいても「分かってもらえない」と寂しくなることはある？', options: ['非常によくある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q30', category: '不安', text: '今の相手（または恋愛全体）に対して不安を感じることは多い？', options: ['常に不安', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q31', category: '我慢', text: '本当は嫌なのに、拒否できずに我慢し続けていることがある？', options: ['非常にある', 'ある', '少しある', 'あまりない', '全くない'] },
  { id: 'q32', category: '遠慮', text: '相手に遠慮してしまい、言いたいことの半分も言えない？', options: ['全く言えない', '言えない', '半分くらい', '大体言える', '何でも言える'] },
  { id: 'q33', category: '疲労', text: '相手に合わせすぎて、恋愛そのものに疲れてしまうことはある？', options: ['非常によくある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q34', category: '嫉妬', text: '嫉妬をしても、みっともないと思って表に出さない？', options: ['絶対に隠す', '隠すほうだ', '場合による', '少し出す', '素直に出す'] },
  { id: 'q35', category: '崩壊', text: '本音を言ったら、今の関係が壊れてしまうのではないかと怖い？', options: ['非常に怖い', '怖い', '少し不安', 'あまり思わない', '全く思わない'] },
  { id: 'q36', category: '優先', text: '自分の気持ちよりも、相手の気持ちを優先してしまうことが多い？', options: ['常に優先', 'よくある', 'たまにある', 'あまりない', '自分が優先'] },
  { id: 'q37', category: '過去', text: 'ケンカや嫌な記憶など、過去の出来事をずっと引きずってしまう？', options: ['非常に引きずる', '引きずる', 'たまにある', 'あまりない', 'すぐ忘れる'] },
  { id: 'q38', category: '理想', text: '今のパートナー（または恋人候補）は、あなたの「理想」とどれくらい近い？', options: ['理想そのもの', 'かなり近い', '普通（標準的）', '少し離れている', '理想とは全く違う'] },
  { id: 'q39', category: '要望', text: '正直なところ、相手に「もっとここを直してほしい」という不満がある？', options: ['山ほどある', '結構ある', '少しある', 'あまりない', '全くない'] },
  { id: 'q40', category: '期待', text: '恋人に対して、無意識に高すぎる理想や期待を押し付けてしまう？', options: ['非常によくある', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q41', category: '満足度', text: '今のパートナー（または現在の状況）に満足している？', options: ['非常に満足', '満足', '普通', '少し不満', '全く不満'] },
  { id: 'q42', category: '幸福感', text: '相手から「大切にされているな」と感じる頻度はどれくらい？', options: ['常に感じる', 'よく感じる', 'たまに感じる', 'あまり感じない', '全く感じない'] },
  { id: 'q43', category: '将来', text: 'この先、状況や心境の変化によって相手と「別れる」可能性があると思う？', options: ['絶対にない', 'まずないと思う', '可能性はゼロではない', '少し不安がある', '常に考えている'] },
  { id: 'q44', category: '安心', text: 'この人と一緒にいると、心から安心して自分らしくいられる？', options: ['非常にそう思う', 'そう思う', '普通', 'あまり思わない', '全く思わない'] },
  { id: 'q45', category: '持続', text: 'これからもこの関係をずっと続けていきたいという意志は強い？', options: ['非常に強い', '強い', '普通', 'あまりない', '別れたい'] },
  { id: 'q46', category: '未来', text: '将来（進路や結婚など）のことについて不安を感じることはある？', options: ['常に不安', 'よくある', 'たまにある', 'あまりない', '全くない'] },
  { id: 'q47', category: '信頼', text: '相手のことを心の底から信頼できていると感じる？', options: ['完璧に信頼', '信頼している', '普通', '疑うこともある', '全く信頼できない'] },
  { id: 'q48', category: '向上心', text: '今の関係を、もっと良くしていきたいという意欲はある？', options: ['非常に強い', '強い', '普通', 'あまりない', 'どうでもいい'] },
  { id: 'q49', category: '誠実', text: 'お互いに「本音で話せている」という実感はある？', options: ['非常にある', 'ある', '普通', 'あまりない', '全くない'] },
  { id: 'q50', category: '重要性', text: 'この関係は、自分にとって人生の大きな財産だと感じる？', options: ['非常に感じる', '感じる', '普通', 'あまり感じない', '感じない'] }
];

const RESULT_TYPES = [
  { title: "思慮深い調律者", desc: "相手の気持ちを敏感に察知し、関係を円滑に進めるために自分を抑える傾向があります。誠実ですが、もう少し自分の本音を解放しても良いかもしれません。" },
  { title: "情熱的な共感者", desc: "深い繋がりと安心感を何よりも大切にするタイプ。感情が豊かで相手への期待も大きい分、一喜一憂しやすい繊細な魅力を持っています。" },
  { title: "自立した探求者", desc: "自分の時間を大切にし、依存しすぎない関係を好みます。冷静に関係を分析できる強さがありますが、時には相手に弱さを見せることで絆が深まります。" },
  { title: "安定の守護者", desc: "信頼と平穏を重視し、波風の立たない関係を築くのが得意です。忍耐強く相手に尽くせますが、限界が来る前にSOSを出す練習をしてみましょう。" }
];

export default function App() {
  const [view, setView] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [allResponses, setAllResponses] = useState([]);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || view !== 'admin') return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'responses');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllResponses(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (error) => {
      console.error("Firestore Error:", error);
    });
    return () => unsubscribe();
  }, [user, view]);

  const handleAnswer = (val) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestion].id]: val };
    setAnswers(newAnswers);
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitResults(newAnswers);
    }
  };

  const submitResults = async (finalAnswers) => {
    setIsSubmitting(true);
    if (user) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'responses'), {
          userId: user.uid,
          answers: finalAnswers,
          createdAt: serverTimestamp(),
          device: navigator.platform
        });
      } catch (e) {
        console.error("Error saving data:", e);
      }
    }
    setIsSubmitting(false);
    setView('result');
  };

  const handleTitleClick = () => {
    setAdminClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setView('admin');
        return 0;
      }
      return next;
    });
    setTimeout(() => setAdminClickCount(0), 3000);
  };

  const QuizView = () => {
    const q = QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

    return (
      <div className="max-w-md mx-auto py-8 px-6">
        <div className="mb-10">
          <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-tighter text-left">
            <span className="text-rose-500">{q.category}</span>
            <span>Progress: {Math.round(progress)}% ({currentQuestion + 1} / 50)</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="min-h-[140px] flex flex-col justify-center mb-8 text-left">
           <span className="text-rose-300 font-serif italic text-4xl mb-2">“</span>
           <h2 className="text-xl font-bold text-gray-800 leading-relaxed">
            {q.text}
          </h2>
        </div>

        <div className="grid gap-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={isSubmitting}
              className="w-full text-left p-4 rounded-xl border border-gray-100 bg-white hover:border-rose-200 hover:bg-rose-50/30 transition-all font-medium text-gray-600 flex justify-between items-center group shadow-sm active:bg-rose-50"
            >
              <span className="text-[15px]">{opt}</span>
              <ChevronRight size={16} className="text-gray-200 group-hover:text-rose-300" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const ResultView = () => {
    const res = RESULT_TYPES[Math.floor(Math.random() * RESULT_TYPES.length)];
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center animate-in fade-in duration-1000">
        <div className="bg-white rounded-3xl p-8 border border-gray-50 mb-8 relative shadow-2xl shadow-rose-100/50">
          <div className="absolute top-0 left-0 p-4 opacity-10 text-left">
            <Heart size={80} className="text-rose-500" />
          </div>
          <h2 className="text-rose-500 font-black tracking-widest text-[10px] mb-4 uppercase">Total Analysis Result</h2>
          <h3 className="text-2xl font-black text-gray-800 mb-6">{res.title}</h3>
          <p className="text-gray-500 leading-loose text-sm text-left mb-6">{res.desc}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-400">
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">マッチ：誠実な人</div>
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">傾向：内省的</div>
          </div>
        </div>
        <button onClick={() => setView('intro')} className="text-gray-300 hover:text-rose-400 transition-colors text-xs font-bold uppercase tracking-tighter">Back to home</button>
      </div>
    );
  };

  const AdminView = () => (
    <div className="p-4 bg-slate-950 min-h-screen text-slate-300 font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500"><Eye size={20}/> 50問回答ログ</h2>
        <button onClick={() => setView('intro')} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white transition-colors uppercase tracking-widest font-bold">Close</button>
      </div>
      <div className="space-y-6">
        {allResponses.length === 0 ? (
          <p className="text-center text-slate-700 py-20 italic">回答データはまだありません</p>
        ) : (
          allResponses.map((r) => (
            <div key={r.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between text-[10px] text-slate-500 mb-4 border-b border-slate-800 pb-2">
                <span className="font-mono">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : 'Saving...'}</span>
                <span>USER_{r.userId.slice(-6)}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 h-[300px] overflow-y-auto pr-2 custom-scrollbar text-left">
                {QUESTIONS.map((q) => (
                  <div key={q.id} className="text-[11px] flex items-start gap-3 border-b border-slate-800/50 py-1">
                    <span className="text-slate-600 shrink-0 w-4">{q.id.replace('q', '')}.</span>
                    <span className="text-slate-500 truncate flex-grow">{q.text}</span>
                    <span className="text-rose-400 font-bold shrink-0">{r.answers[q.id] || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFE] text-gray-900 font-sans selection:bg-rose-100 selection:text-rose-600 overflow-x-hidden">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col bg-white shadow-[0_0_50px_rgba(0,0,0,0.02)]">
        {view !== 'admin' && (
          <nav className="p-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-rose-50/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center text-white rotate-6 shadow-sm shadow-rose-200">
                <Heart size={16} fill="currentColor" />
              </div>
              <span className="font-black text-sm tracking-tighter text-gray-800 uppercase text-left">Value Matcher</span>
            </div>
            <div className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Live Mode</span>
            </div>
          </nav>
        )}
        <main className="flex-grow flex flex-col">
          {view === 'intro' && <IntroView />}
          {view === 'quiz' && <QuizView />}
          {view === 'result' && <ResultView />}
          {view === 'admin' && <AdminView />}
        </main>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}
return (
  <div className="app">
    <div className="card">
      <h1 className="title">恋愛価値観診断</h1>

      <div className="question">
        {q.text}
      </div>

      {q.options.map(opt => (
        <div
          key={opt}
          className="answer"
          onClick={() => handleAnswer(opt)}
        >
          {opt}
        </div>
      ))}
    </div>
  </div>
);
