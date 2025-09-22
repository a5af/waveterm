// Copyright 2025, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { isDev } from "@/store/global";
import { ImperativePanelGroupHandle, ImperativePanelHandle } from "react-resizable-panels";

const AIPANEL_DEFAULTWIDTH = 300;
const AIPANEL_MINWIDTH = 250;
const AIPANEL_MAXWIDTHRATIO = 0.5;

class WorkspaceLayoutModel {
    aiPanelVisible: boolean;
    aiPanelRef: ImperativePanelHandle | null;
    panelGroupRef: ImperativePanelGroupHandle | null;
    aiPanelWidth: number;
    inResize: boolean;

    constructor() {
        this.aiPanelVisible = isDev();
        this.aiPanelRef = null;
        this.panelGroupRef = null;
        this.aiPanelWidth = AIPANEL_DEFAULTWIDTH;
        this.inResize = false;
    }

    registerRefs(aiPanelRef: ImperativePanelHandle, panelGroupRef: ImperativePanelGroupHandle): void {
        this.aiPanelRef = aiPanelRef;
        this.panelGroupRef = panelGroupRef;
        this.syncAIPanelRef();
    }

    syncAIPanelRef(): void {
        if (!this.aiPanelRef || !this.panelGroupRef) {
            return;
        }

        const currentWindowWidth = window.innerWidth;
        const aiPanelPercentage = this.getAIPanelPercentage(currentWindowWidth);
        const mainContentPercentage = this.getMainContentPercentage(currentWindowWidth);

        if (this.aiPanelVisible) {
            this.aiPanelRef.expand();
        } else {
            this.aiPanelRef.collapse();
        }

        this.inResize = true;
        const layout = [aiPanelPercentage, mainContentPercentage];
        this.panelGroupRef.setLayout(layout);
        this.inResize = false;
    }

    getMaxAIPanelWidth(windowWidth: number): number {
        return Math.floor(windowWidth * AIPANEL_MAXWIDTHRATIO);
    }

    getClampedAIPanelWidth(width: number, windowWidth: number): number {
        const maxWidth = this.getMaxAIPanelWidth(windowWidth);
        if (AIPANEL_MINWIDTH > maxWidth) {
            return AIPANEL_MINWIDTH;
        }
        return Math.max(AIPANEL_MINWIDTH, Math.min(width, maxWidth));
    }

    getAIPanelVisible(): boolean {
        return this.aiPanelVisible;
    }

    setAIPanelVisible(visible: boolean): void {
        if (!isDev() && visible) {
            return;
        }
        this.aiPanelVisible = visible;
        this.syncAIPanelRef();
    }

    getAIPanelWidth(): number {
        return this.aiPanelWidth;
    }

    setAIPanelWidth(width: number): void {
        this.aiPanelWidth = width;
    }

    getAIPanelPercentage(windowWidth: number): number {
        const isVisible = this.getAIPanelVisible();
        if (!isVisible) {
            return 0;
        }
        const aiPanelWidth = this.getAIPanelWidth();
        const clampedWidth = this.getClampedAIPanelWidth(aiPanelWidth, windowWidth);
        const percentage = (clampedWidth / windowWidth) * 100;
        return Math.max(0, Math.min(percentage, 100));
    }

    getMainContentPercentage(windowWidth: number): number {
        const aiPanelPercentage = this.getAIPanelPercentage(windowWidth);
        return Math.max(0, 100 - aiPanelPercentage);
    }

    handleAIPanelResize(width: number, windowWidth: number): void {
        if (!isDev()) {
            return;
        }
        if (!this.aiPanelVisible) {
            return;
        }
        const clampedWidth = this.getClampedAIPanelWidth(width, windowWidth);
        this.setAIPanelWidth(clampedWidth);

        if (!this.getAIPanelVisible()) {
            this.setAIPanelVisible(true);
        }
    }
}

const workspaceLayoutModel = new WorkspaceLayoutModel();

export { workspaceLayoutModel, WorkspaceLayoutModel };
