import { ResizeGroup, ResizeItem, ResizeHandler } from '@douyinfe/semi-ui';
import { LeftSidebar } from './LeftSidebar';
import { MainArea } from './MainArea';
import { Statusbar } from './Statusbar';
import './layout.css';

export function AppLayout() {
  return (
    <div className="ga-app-layout">
      <div className="ga-app-body">
        <ResizeGroup direction="horizontal">
          <ResizeItem
            defaultSize="260px"
            min="200px"
            max="340px"
            className="ga-sidebar-item"
          >
            <LeftSidebar />
          </ResizeItem>
          <ResizeHandler />
          <ResizeItem className="ga-main-item">
            <MainArea />
          </ResizeItem>
        </ResizeGroup>
      </div>
      <Statusbar />
    </div>
  );
}
