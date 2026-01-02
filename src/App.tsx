import { useState, useRef, useEffect } from 'react'
import './App.css'
import { results, luckyItems } from './data'
import html2canvas from 'html2canvas'

interface OmikujiData {
  rank: string
  overall: string
  details: {
    [key: string]: string
  }
}

interface LuckyItem {
  name: string
  description: string
}

function App() {
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [currentOmikuji, setCurrentOmikuji] = useState<OmikujiData | null>(null)
  const [currentLuckyItem, setCurrentLuckyItem] = useState<LuckyItem | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)
  const shareButtonRef = useRef<HTMLButtonElement>(null)
  
  const drawOmikuji = () => {
    setIsDrawing(true)
    setHasDrawn(false)
    
    // ランダムにおみくじを選択
    const randomIndex = Math.floor(Math.random() * results.length)
    const selectedOmikuji = results[randomIndex]

    const randomLuckyIndex = Math.floor(Math.random() * luckyItems.length)
    const selectedLuckyItem = luckyItems[randomLuckyIndex]
    
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

    const handleScroll = () => {
      if (shareButtonRef.current) {
        const rect = shareButtonRef.current.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
        setShowSharePopup(!isVisible)
      }
    }

    // 初期チェック
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [hasDrawn])

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
      shareRef.current.style.display = 'none'

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
      
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 5}s`
          }} />
        ))}
      </div>
      {!isDrawing && <h1 className="title">神の導き</h1>}
      
      {!hasDrawn && !isDrawing && (
        <>
          <div className="omikuji-box">
            <div className="box-content">
              <p className="box-text">おみくじを引く</p>
            </div>
            <button className="draw-button" onClick={drawOmikuji}>
              引く
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
                <p>「来世に期待してください。」</p>
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
              bad-omikuji<br />
              Made with ❤️ by hato.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
