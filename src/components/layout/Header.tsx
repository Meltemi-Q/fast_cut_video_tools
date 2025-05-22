interface HeaderProps {
  onReset: () => void;
}

const Header = ({ onReset }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">QC</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">快剪工具</h1>
        </div>
        
        <button 
          onClick={onReset}
          className="btn-secondary text-sm"
        >
          重新开始
        </button>
      </div>
    </header>
  );
};

export default Header; 