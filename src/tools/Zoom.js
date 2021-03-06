import React, { Fragment } from "react";
import { Divider } from "antd";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import BasicToolView from "../components/Tools/Basic";
import ToolMixin from "../mixins/Tool";

const ToolView = observer(({ item }) => {
  return (
    <Fragment>
      <Divider style={{ margin: "5px 0;" }} dashed />
      <BasicToolView
        selected={item.selected}
        icon="drag"
        tooltip="Move position"
        onClick={ev => {
          const sel = item.selected;
          item.manager.unselectAll();

          item.setSelected(!sel);

          if (item.selected) {
            const stage = item.obj.stageRef;
            stage.container().style.cursor = "all-scroll";
          }
        }}
      />
      <BasicToolView
        icon="zoom-in"
        tooltip="Zoom into the image"
        onClick={ev => {
          // console.log(self.image);
          // console.log(self._image);
          item.handleZoom(1.2);
        }}
      />
      <BasicToolView
        icon="zoom-out"
        tooltip="Zoom out of the image"
        onClick={ev => {
          item.handleZoom(0.8);
        }}
      />
    </Fragment>
  );
});

const _Tool = types
  .model({
    // image: types.late(() => types.safeReference(Registry.getModelByTag("image")))
  })
  .views(self => ({
    get viewClass() {
      return <ToolView item={self} />;
    },
  }))
  .actions(self => ({
    mouseupEv() {
      self.mode = "viewing";
    },

    mousemoveEv(ev, [x, y]) {
      if (self.mode !== "moving") return;

      const item = self._manager.obj;
      const stage = item.stageRef;

      // console.log(item.zoomingPositionX);
      // const newPos = {
      //     x: -1*x,
      //     y: -1*y
      // }

      // item.setZoomPosition(item.zoomingPositionX+1, item.zoomingPositionY+1);

      // stage.position(newPos);
      // stage.batchDraw();
    },

    mousedownEv(ev, [x, y]) {
      self.mode = "moving";
    },

    handleZoom(e, val) {
      if (e.evt && !e.evt.ctrlKey) {
        return;
      } else if (e.evt && e.evt.ctrlKey) {
        /**
         * Disable scrolling page
         */
        e.evt.preventDefault();
      }

      // console.log(getEnv(self).manager);
      // console.log(getEnv(self));

      const item = self._manager.obj;

      // const { item } = this.props;
      item.freezeHistory();

      const stage = item.stageRef;
      const scaleBy = parseFloat(item.zoomby);
      const oldScale = stage.scaleX();

      let mousePointTo;
      let newScale;
      let pos;
      let newPos;

      if (e.evt) {
        mousePointTo = {
          x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
          y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        newPos = {
          x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
          y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        };
      } else {
        pos = {
          x: stage.width() / 2,
          y: stage.height() / 2,
        };

        mousePointTo = {
          x: pos.x / oldScale - stage.x() / oldScale,
          y: pos.y / oldScale - stage.y() / oldScale,
        };

        newScale = Math.max(0.05, oldScale * e);

        newPos = {
          x: -(mousePointTo.x - pos.x / newScale) * newScale,
          y: -(mousePointTo.y - pos.y / newScale) * newScale,
        };
      }

      if (item.negativezoom !== true && newScale <= 1) {
        item.setZoom(1, 0, 0);
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
        return;
      }

      stage.scale({ x: newScale, y: newScale });

      item.setZoom(newScale, newPos.x, newPos.y);
      stage.position(newPos);
      stage.batchDraw();
    },
  }));

const Zoom = types.compose(ToolMixin, BaseTool, _Tool);

// Registry.addTool("zoom", Zoom);

export { Zoom };

// ImageTools.addTool(ZoomTool);
