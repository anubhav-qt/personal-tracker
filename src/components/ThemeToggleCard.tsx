import styled from 'styled-components';

interface ThemeToggleCardProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  timeRange?: 'week' | 'month';
  onTimeRangeChange?: (range: 'week' | 'month') => void;
}

const ThemeToggleCard = ({ 
  theme, 
  onToggleTheme,
  timeRange = 'month',
  onTimeRangeChange
}: ThemeToggleCardProps) => {
  return (
    <StyledWrapper className="h-full w-full">
      <div className="h-full w-full">
        <input 
          id="switch" 
          type="checkbox" 
          checked={theme === 'dark'} 
          onChange={onToggleTheme}
        />
        <div className="app h-full w-full">
          <div className="body h-full w-full flex items-center justify-center">
            <div className="phone h-full w-full">
              <div className="menu">
                {onTimeRangeChange ? (
                  <div className="time-selector">
                    <span className="time-label">View Analytics:</span>
                    <div className="time-toggle">
                      <button 
                        className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
                        onClick={() => onTimeRangeChange('week')}
                      >
                        Weekly
                      </button>
                      <button 
                        className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
                        onClick={() => onTimeRangeChange('month')}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="time"></div>
                )}
              </div>
              <div className="content">
                <div className="circle">
                  <div className="crescent" />
                </div>
                <label htmlFor="switch">
                  <div className="toggle" />
                  <div className="names">
                    <p className="light">Light</p>
                    <p className="dark">Dark</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  
  > div {
    width: 100%;
    height: 100%;
  }

  .app {
    display: flex;
    height: 100%;
    width: 100%;
  }
  
  .body {
    flex: 1;
    height: 100%;
    width: 100%;
  }

  /* GENERAL */
  .credit {
    position: fixed;
    right: 2rem;
    bottom: 2rem;
    color: white;
  }

  .credit a {
    color: inherit;
  }

  /* Main Circle */
  .main-circle {
    width: 40rem;
    height: 40rem;
    border-radius: 100%;
    background: linear-gradient(40deg, #ff0080, #ff8c00 70%);
    position: absolute;
    z-index: 1;
    left: 50%;
    -webkit-transform: translate(-50%, -70%);
    -ms-transform: translate(-50%, -70%);
    transform: translate(-50%, -70%);
  }

  /* Phone */
  .phone {
    position: relative;
    z-index: 2;
    background-color: inherit;
    transition: background-color 0.6s;
    -webkit-box-shadow: 0 4px 35px rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 35px rgba(0, 0, 0, 0.1);
    border-radius: 30px;
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  /* Top */
  .menu {
    font-size: 80%;
    opacity: 0.95;
    padding: 0.8rem 1.8rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Time selector styles */
  .time-selector {
    display: flex;
    align-items: center;
    font-size: 12px;
    opacity: 1;
    width: 100%;
    color: white;
  }

  .time-label {
    margin-left: 5px;
    margin-right: 5px;
    color: white;
    font-weight: 500;
  }

  .time-toggle {
    display: flex;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 2px;
    width: 50%;
    justify-content: space-between;
    gap: 2px;
  }

  .time-btn {
    border: none;
    background: none;
    border-radius: 10px;
    height: 20px;
    flex: 1;
    font-size: 11px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    padding: 0 8px;
  }

  .time-btn.active {
    background-color: #3b82f6;
    color: white;
  }

  /* Middle */
  .content {
    display: flex;
    flex-direction: column;
    margin: auto;
    text-align: center;
    width: 70%;
    flex: 1;
    justify-content: center;
    padding-bottom: 1.5rem; /* Added padding at the bottom */
  }

  .circle {
    position: relative;
    border-radius: 100%;
    width: 8rem;
    height: 8rem;
    background: linear-gradient(
      40deg,
      #ff0080,
      #ff8c00,
      #e8e8e8,
      #8983f7,
      #a3dafb 80%
    );
    background-size: 400%;
    transition: background-position 0.6s;
    margin: auto;
  }

  .crescent {
    position: absolute;
    border-radius: 100%;
    right: 0;
    width: 6rem;
    height: 6rem;
    background: #e8e8e8;
    transform: scale(0);
    transform-origin: top right;
    transition:
      transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1),
      background-color 0.6s;
  }

  label,
  .toggle {
    height: 2.8rem;
    border-radius: 100px;
  }

  label {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 100px;
    position: relative;
    margin: 1.8rem 0 0 0;
    cursor: pointer;
  }

  .toggle {
    position: absolute;
    width: 50%;
    background-color: #fff;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .names {
    font-size: 90%;
    font-weight: bolder;
    color: black;
    width: 65%;
    margin-left: 17.5%;
    margin-top: 6.5%;
    position: absolute;
    display: flex;
    justify-content: space-between;
    user-select: none;
  }

  .dark {
    opacity: 0.5;
  }

  .time {
    color: black;
  }
  
  /* -------- Switch Styles ------------*/
  [type="checkbox"] {
    display: none;
  }
  
  /* Toggle */
  [type="checkbox"]:checked + .app .toggle {
    transform: translateX(100%);
    background-color: #34323d;
  }

  [type="checkbox"]:checked + .app .dark {
    opacity: 1;
    color: white;
  }

  [type="checkbox"]:checked + .app .light {
    opacity: 1;
    color: white;
  }
  
  /* App */
  [type="checkbox"]:checked + .app .phone {
    background-color: #26242e;
    color: white;
  }
  
  /* Circle */
  [type="checkbox"]:checked + .app .crescent {
    transform: scale(1);
    background: #26242e;
  }

  [type="checkbox"]:checked + .app .circle {
    background-position: 100% 100%;
  }

  [type="checkbox"]:checked + .app .main-circle {
    background: linear-gradient(40deg, #8983f7, #a3dafb 70%);
  }

  [type="checkbox"]:checked + .time {
    color: white;
  }

  [type="checkbox"]:checked + .app .time-selector {
    color: white;
  }

  [type="checkbox"]:checked + .app .body .phone .menu .time {
    color: white;
  }

  [type="checkbox"]:checked + .app .body {
    border-radius: 30px;
  }
  
  @media (max-width: 768px) {
    .circle {
      width: 6rem;
      height: 6rem;
    }
    
    .crescent {
      width: 4.5rem;
      height: 4.5rem;
    }
  }
`;

export default ThemeToggleCard;
