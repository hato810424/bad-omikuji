import { useState, useRef, useEffect, useMemo } from 'react'
import './App.css'
import { results, luckyItems, type OmikujiData, type LuckyItem } from './data'
import html2canvas from 'html2canvas'

function App() {
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [currentOmikuji, setCurrentOmikuji] = useState<OmikujiData | null>(null)
  const [currentLuckyItem, setCurrentLuckyItem] = useState<LuckyItem | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${5 + Math.random() * 5}s`,
      })),
    []
  )
  
  const drawOmikuji = () => {
    setIsDrawing(true)
    setHasDrawn(false)
    
    // URLパラメータからインデックスを取得（デバッグ用）
    const params = new URLSearchParams(window.location.search)
    const debugIndex = params.get('index')
    const debugLuckyIndex = params.get('luckyIndex')
    
    // ランダムにおみくじを選択（デバッグモードの場合は指定されたインデックスを使用）
    const randomIndex = debugIndex !== null 
      ? Math.min(Math.max(0, parseInt(debugIndex)), results.length - 1)
      : Math.floor(Math.random() * results.length)
    const selectedOmikuji = results[randomIndex]

    const randomLuckyIndex = debugLuckyIndex !== null
      ? Math.min(Math.max(0, parseInt(debugLuckyIndex)), luckyItems.length - 1)
      : Math.floor(Math.random() * luckyItems.length)
    const selectedLuckyItem = luckyItems[randomLuckyIndex]
    
    // デバッグ情報をコンソールに出力（開発モードのみ）
    if (import.meta.env.DEV) {
      console.log(`おみくじインデックス: ${randomIndex} / ${results.length - 1}`)
      console.log(`ラッキーアイテムインデックス: ${randomLuckyIndex} / ${luckyItems.length - 1}`)
      console.log(`デバッグURL: ${window.location.origin}${window.location.pathname}?index=${randomIndex}&luckyIndex=${randomLuckyIndex}`)
    }
    
    // アニメーション後に結果を表示
    setTimeout(() => {
      setCurrentOmikuji(selectedOmikuji)
      setCurrentLuckyItem(selectedLuckyItem)
      setIsDrawing(false)
      setHasDrawn(true)
    }, 2000)
  }

  const reset = () => {
    setHasDrawn(false)
    setIsDrawing(false)
    setCurrentOmikuji(null)
    setCurrentLuckyItem(null)
    setShowSharePopup(false)
  }

  // スクロール監視：共有ボタンが画面外にあるときポップアップを表示
  useEffect(() => {
    if (!hasDrawn || !shareButtonRef.current) {
      setShowSharePopup(false)
      return
    }

    let timeoutId: number | undefined

    const handleScroll = () => {
      if (shareButtonRef.current) {
        const rect = shareButtonRef.current.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
        
        // タイマーをクリア
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (!isVisible) {
          timeoutId = window.setTimeout(() => {
            setShowSharePopup(true)
          }, 800)
        } else {
          // ボタンが見えている場合は即座に非表示
          setShowSharePopup(false)
        }
      }
    }

    // 初期チェック
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [hasDrawn])

  useEffect(() => {
    if (!isAboutOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAboutOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAboutOpen])

  const shareToInstagram = async () => {
    if (!shareRef.current) return

    try {
      // シェア用要素を一時的に表示
      shareRef.current.style.display = 'flex'
      
      // 結果を画像として生成
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#1a0000',
        scale: 2,
        logging: false,
        width: 1080,
        height: 1920,
      })
      
      // シェア用要素を非表示に戻す
      shareRef.current.style.display = '';

      // Canvasをblobに変換
      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], 'omikuji-result.jpg', { type: 'image/jpeg' })

        // Web Share APIがサポートされているか確認
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '', // 空文字列にすることでInstagramストーリーズに投稿可能
            })
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              console.error('共有エラー:', err)
              alert('共有に失敗しました')
            }
          }
        } else {
          alert('この機能はお使いのブラウザではサポートされていません')
        }
      }, 'image/jpeg')
    } catch (err) {
      console.error('画像生成エラー:', err)
      alert('画像の生成に失敗しました')
    }
  }

  return (
    <div className="omikuji-container">
      {/* デバッグモード切り替えボタン */}
      {import.meta.env.DEV && <button 
        className="debug-toggle" 
        onClick={() => setDebugMode(!debugMode)}
        title="シェア画像プレビュー"
      >
        {debugMode ? '👁️' : '🔍'}
      </button>}

      {/* Instagram共有ポップアップ */}
      {showSharePopup && (
        <div className="share-popup" onClick={shareToInstagram}>
          <div className="share-popup-text">Instagramでシェア</div>
        </div>
      )}

      {/* about（ジョークアプリ告知）モーダル */}
      {isAboutOpen && (
        <div className="modal-overlay" onClick={() => setIsAboutOpen(false)} role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setIsAboutOpen(false)} aria-label="閉じる">
              ×
            </button>
            <h2 className="modal-title" id="about-modal-title">神の導きとは？</h2>
            <p className="modal-text">
              「神の導き」<a href='https://github.com/hato810424/bad-omikuji'>bad-omikuji</a>は、常に大凶が出てバカ煽り散らかされるジョークアプリです。
            </p>
            <div className="modal-actions">
              <button className="modal-ok" onClick={() => setIsAboutOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="particles">
        {particles.map((style, i) => (
          <div key={i} className="particle" style={{
            left: style.left,
            animationDelay: style.animationDelay,
            animationDuration: style.animationDuration
          }} />
        ))}
      </div>

      {!isDrawing && <div className="title-container">
        <h1 className="title">神の導き</h1>
        {!hasDrawn && <button className="about" onClick={() => setIsAboutOpen(true)}>神の導きとは？</button>}
      </div>}
      
      {!hasDrawn && !isDrawing && (
        <>
          <div className="omikuji-box">
            <div className="box-content">
              <p className="box-text">おみくじを引く</p>
            </div>
            <button className="draw-button" onClick={drawOmikuji}>
              引いてみる
            </button>
          </div>
          <div className="copyright initial-screen">
            <a href='https://github.com/hato810424/bad-omikuji'>bad-omikuji</a> - Made with ❤️ by <a href='https://github.com/hato810424'>hato</a>.
          </div>
        </>
      )}

      {isDrawing && (
        <div className="omikuji-box shaking">
          <div className="box-content">
            <p className="box-text">引いています...</p>
          </div>
        </div>
      )}

      {hasDrawn && currentOmikuji && (
        <div className="result-container">
          <div className="result-paper">
            <h2 className="result-title">運勢</h2>
            <div className="result-text">{currentOmikuji.rank}</div>

            <div className="result-description">
              <div className="section">
                <h3 className="section-title">■ 総評</h3>
                <p className="section-text">
                  {currentOmikuji.overall}
                </p>
              </div>

              <div className="section">
                <h3 className="section-title">■ 個別運勢</h3>
                {Object.entries(currentOmikuji.details).map(([key, value]) => (
                  <div key={key} className="fortune-item">
                    <h4>{key}</h4>
                    <p>{value}</p>
                  </div>
                ))}
              </div>

              <div className="section">
                <h3 className="section-title">■ ラッキーアイテム</h3>
                <p className="lucky-item">{currentLuckyItem?.name}</p>
                <p className="lucky-desc">{currentLuckyItem?.description}</p>
              </div>

              <div className="section advice">
                <h3 className="section-title">■ 助言</h3>
                <p className="section-text">
                  ここに来たのが間違いでしたね。神様もあなたのあまりの運の悪さにドン引きして、さっき裏口から帰られましたよ。
                </p>
              </div>

              <div className="god-message">
                <p>【神様のつぶやき】</p>
                <p>「来世に期待しなさい。」</p>
              </div>
            </div>
          </div>
          <div className="button-group">
            <button ref={shareButtonRef} className="share-button" onClick={shareToInstagram}>
              Instagramでシェア
            </button>
            <button className="reset-button" onClick={reset}>
              懲りずにもう一度引く
            </button>
          </div>
          <div className="copyright">
            <a href='https://github.com/hato810424/bad-omikuji'>bad-omikuji</a> - Made with ❤️ by <a href='https://github.com/hato810424'>hato</a>.
          </div>
        </div>
      )}

      {/* シェア用の隠し要素 */}
      {currentOmikuji && (
        <div className={`share-container ${debugMode ? 'debug-mode' : ''}`} ref={shareRef}>
          <div className="share-content">
            <div className="share-header">
              <h1 className="share-title">神の導きを受けました</h1>
              <div className="share-torii">⛩️</div>
            </div>
            
            <div className="share-result">
              <div className="share-result-label">運勢</div>
              <div className="share-result-text">{currentOmikuji.rank}</div>
            </div>

            <div className="share-overall">
              <h3 className="share-section-title">■ 総評</h3>
              <p className="share-section-text">{currentOmikuji.overall}</p>
            </div>

            <div className="share-footer">
              <h3 className="share-lucky-title">■ ラッキーアイテム</h3>
              <p className="share-lucky-name">{currentLuckyItem?.name}</p>
              <p className="share-lucky-desc">{currentLuckyItem?.description}</p>
            </div>

            <div className="share-watermark">
              bad-omikuji.pages.dev<br />
              Made with ❤️ by hato.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
