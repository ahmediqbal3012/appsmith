import React, { useRef, MutableRefObject, useCallback, useEffect } from "react";
import styled from "styled-components";
import Divider from "components/editorComponents/Divider";
import {
  useFilteredEntities,
  useWidgets,
  useActions,
  useFilteredDatasources,
} from "./hooks";
import Search from "./ExplorerSearch";
import ExplorerPageGroup from "./Pages/PageGroup";
import { NonIdealState, Classes, IPanelProps } from "@blueprintjs/core";
import WidgetSidebar from "../WidgetSidebar";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";
import { useParams } from "react-router";
import { ExplorerURLParams } from "./helpers";
import JSDependencies from "./JSDependencies";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";
import { getPlugins } from "selectors/entitiesSelector";
import ScrollIndicator from "components/ads/ScrollIndicator";
import { PropertyPaneView } from "../PropertyPane";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    width: 0px;
    -webkit-appearance: none;
  }
`;

const NoResult = styled(NonIdealState)`
  &.${Classes.NON_IDEAL_STATE} {
    height: auto;
  }
`;

const StyledDivider = styled(Divider)`
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

function EntityExplorer(props: IPanelProps) {
  const { applicationId } = useParams<ExplorerURLParams>();

  const searchInputRef: MutableRefObject<HTMLInputElement | null> = useRef(
    null,
  );
  PerformanceTracker.startTracking(PerformanceTransactionName.ENTITY_EXPLORER);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const { clearSearch, searchKeyword } = useFilteredEntities(searchInputRef);
  const datasources = useFilteredDatasources(searchKeyword);

  const plugins = useSelector(getPlugins);

  const widgets = useWidgets(searchKeyword);
  const actions = useActions(searchKeyword);

  let noResults = false;
  if (searchKeyword) {
    const noWidgets = Object.values(widgets).filter(Boolean).length === 0;
    const noActions =
      Object.values(actions).filter((actions) => actions && actions.length > 0)
        .length === 0;
    const noDatasource =
      Object.values(datasources).filter(
        (datasources) => datasources && datasources.length > 0,
      ).length === 0;
    noResults = noWidgets && noActions && noDatasource;
  }
  const { openPanel } = props;
  const showWidgetsSidebar = useCallback(
    (pageId: string) => {
      history.push(BUILDER_PAGE_URL(applicationId, pageId));
      openPanel({ component: WidgetSidebar });
    },
    [openPanel, applicationId],
  );
  const dispatch = useDispatch();
  const hidePropertyPane = () =>
    dispatch({
      type: ReduxActionTypes.HIDE_PROPERTY_PANE,
    });
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);

  return isPropPaneVisible ? (
    <PropertyPaneView
      hidePropertyPane={hidePropertyPane}
      {...props}
      theme={EditorTheme.DARK}
    />
  ) : (
    <Wrapper ref={explorerRef}>
      <Search clear={clearSearch} isHidden ref={searchInputRef} />

      <ExplorerPageGroup
        actions={actions}
        datasources={datasources}
        plugins={plugins}
        searchKeyword={searchKeyword}
        showWidgetsSidebar={showWidgetsSidebar}
        step={0}
        widgets={widgets}
      />
      {noResults && (
        <NoResult
          className={Classes.DARK}
          description="Try modifying the search keyword."
          icon="search"
          title="No entities found"
        />
      )}
      <StyledDivider />
      <JSDependencies />
      <ScrollIndicator containerRef={explorerRef} />
    </Wrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

EntityExplorer.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default EntityExplorer;
