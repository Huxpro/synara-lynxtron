globalThis.__SYNARA_PERCEPTUAL_EVIDENCE__ = {
  "id": "p10-perceptual-fidelity",
  "label": "P10 Perceptual Fidelity",
  "defaults": {
    "snapshotSha256": "ad4295f695424da64b6fcdb8a3a7c68ed4d766b91bf79069e87ceecbb0d82666",
    "comparisonViewport": {
      "width": 1280,
      "height": 788
    }
  },
  "states": [
    {
      "id": "landing-default",
      "label": "New Chat landing · Default",
      "semanticRoute": "new-chat",
      "theme": "light",
      "density": "comfortable",
      "interactionState": "default",
      "viewport": {
        "width": 1280,
        "height": 820,
        "devicePixelRatio": 1
      },
      "comparisonViewport": {
        "width": 1280,
        "height": 788
      },
      "residuals": [
        {
          "id": "landing-default-shell-inset",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "apps/lynx/src/app/App.css / SharedAppShellFrame host geometry",
          "summary": "Lynx-for-Web shell is inset by 8px on both axes.",
          "impact": "Every high-salience anchor reads as a shifted replica even when component geometry is exact.",
          "recommendation": "Remove or centralize the Browser-only host inset so product content uses the Web authority origin; preserve any Native titlebar correction separately.",
          "evidence": "browser/landing-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "landing-default-header-relative-offset",
          "category": "GEOMETRY",
          "severity": "P2",
          "status": "fixed",
          "owner": "ChatSurfaceHeaderFrame Lynx host adapter",
          "summary": "Lynx header title is +16px X and +9.5px Y versus Web.",
          "impact": "Header and body do not share the same visual rail, increasing the uncanny shell impression.",
          "recommendation": "Calibrate header frame padding after the outer shell inset is removed; target relative delta <=2px.",
          "evidence": "browser/landing-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "landing-default-landing-vertical-offset",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "CenteredEmptyLandingStack / Lynx host inset",
          "summary": "Landing hero and Composer are shifted down/right by about 8px.",
          "impact": "The main focal composition misses the authority center despite exact hero and Composer sizes.",
          "recommendation": "Fix the shared shell/landing origin rather than adding local negative margins.",
          "evidence": "browser/landing-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        }
      ],
      "evidence": {
        "web": {
          "status": "retained",
          "reason": null,
          "path": "browser/landing-default/web/raw.png",
          "comparisonPath": "browser/landing-default/web/comparison.png",
          "geometry": "browser/landing-default/web/geometry.json",
          "geometryData": {
            "client": "web",
            "stateId": "landing-default",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "sidebar": {
                "tag": "DIV",
                "className": "relative z-0 flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm/5 app-sidebar-surface",
                "text": "Toggle SidebarToggle SidebarStudioProjectsNew thread⌘NSearch⌘KKanbanPull requestsAutomationsProjects",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "tag": "BUTTON",
                "className": "peer/menu-button overflow-hidden p-2 ring-ring/60 active:bg-[var(--sidebar-accent-active)] active:text-[var(--sidebar-accent-foreground)] disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pe-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[var(--sidebar-accent-active)] data-[active=true]:text-[var(--sidebar-accent-foreground)] data-[state=open]:hover:bg-[var(--sidebar-accent)] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0 flex w-full min-w-0 items-center text-left select-none min-h-[var(--app-density-row-height,1.75rem)] h-[var(--app-density-row-height,1.75rem)] gap-[var(--app-density-row-gap,0.5rem)] rounded-md px-2 py-[var(--app-density-row-padding-y,0.125rem)] text-[length:var(--app-font-size-ui,12px)] font-normal outline-hidden transition-colors focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring hover:bg-[var(--sidebar-accent)] group-hover/project-header:bg-[var(--sidebar-accent)] group-hover/project-header:text-[var(--sidebar-accent-foreground)] cursor-grab active:cursor-grabbing",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 6,
                  "y": 287.25,
                  "width": 244,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "tag": "SPAN",
                "className": "inline-block shrink-0 bg-current size-4",
                "text": "",
                "box": {
                  "x": 14,
                  "y": 293.25,
                  "width": 16,
                  "height": 16
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "tag": "H2",
                "className": "text-[26px] font-normal leading-[1.15] tracking-[-0.015em] text-foreground/95 sm:text-[30px]",
                "text": "What should we work on?",
                "box": {
                  "x": 607.8125,
                  "y": 367.25,
                  "width": 320.359375,
                  "height": 34.5
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "34.5px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "tag": "DIV",
                "className": "chat-composer-surface border border-[color:color-mix(in_srgb,var(--color-border-heavy)_95%,var(--foreground)_5%)] dark:border-border shadow-[0_4px_18px_-6px_color-mix(in_srgb,var(--foreground)_7%,transparent)] dark:shadow-[0_6px_24px_-10px_rgba(0,0,0,0.30)] transition-colors duration-200",
                "text": "Ask for follow-up changes or attach imagesFull accessGPT-5.5Medium",
                "box": {
                  "x": 400,
                  "y": 421.75,
                  "width": 736,
                  "height": 95
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864706)",
                  "borderColor": "color(srgb 0.0509804 0.0509804 0.0509804 / 0.105882)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, color(srgb 0.0509804 0.0509804 0.0509804 / 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "tag": "DIV",
                "className": "block max-h-[200px] w-full overflow-y-auto whitespace-pre-wrap break-words bg-transparent text-foreground focus:outline-none font-system-ui text-[length:var(--app-font-size-chat,12px)] leading-relaxed min-h-[var(--app-density-composer-editor-min-height,2lh)] [&_p]:m-0",
                "text": "",
                "box": {
                  "x": 413,
                  "y": 434.75,
                  "width": 708,
                  "height": 39
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "tag": "BUTTON",
                "className": "[&_svg,&_[data-slot=central-icon]]:-mx-0.5 relative inline-flex cursor-pointer items-center rounded-lg border outline-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_[data-slot=central-icon]:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 [&_[data-slot=central-icon]:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 sm:[&_[data-slot=central-icon]:not([class*='size-'])]:size-4 [&_svg,&_[data-slot=central-icon]]:pointer-events-none [&_svg,&_[data-slot=central-icon]]:shrink-0 gap-1.5 sm:h-7 border-transparent bg-transparent focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-[var(--color-background-elevated-secondary)] [:hover,[data-pressed]]:text-[var(--color-text-foreground)] data-pressed:bg-[var(--color-background-elevated-secondary)] min-w-0 justify-start overflow-hidden whitespace-nowrap px-1.5 [&_svg]:mx-0 text-[length:var(--app-font-size-ui-sm,11px)] text-[var(--color-text-foreground-secondary)] sm:text-[length:var(--app-font-size-ui-sm,11px)] font-normal hover:text-[var(--color-text-foreground)] data-pressed:text-[var(--color-text-foreground)] max-w-56 shrink sm:max-w-64 sm:px-1.5 h-7 py-1",
                "text": "Work in a project",
                "box": {
                  "x": 408,
                  "y": 520.75,
                  "width": 122.859375,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "11px",
                  "weight": "400",
                  "lineHeight": "16.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(0, 0, 0, 0)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "H2",
                "className": "max-w-[clamp(12rem,42vw,36rem)] truncate font-system-ui text-[length:var(--app-font-size-ui,12px)] font-normal text-foreground",
                "text": "New Chat",
                "box": {
                  "x": 298,
                  "y": 14,
                  "width": 55.0625,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "styles": "browser/landing-default/web/styles.json",
          "stylesData": {
            "client": "web",
            "stateId": "landing-default",
            "roles": {
              "sidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "34.5px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864706)",
                  "borderColor": "color(srgb 0.0509804 0.0509804 0.0509804 / 0.105882)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, color(srgb 0.0509804 0.0509804 0.0509804 / 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "11px",
                  "weight": "400",
                  "lineHeight": "16.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(0, 0, 0, 0)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "console": "browser/landing-default/web/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "lynx": {
          "status": "retained",
          "reason": null,
          "path": "browser/landing-default/lynx/raw.png",
          "comparisonPath": "browser/landing-default/lynx/comparison.png",
          "geometry": "browser/landing-default/lynx/geometry.json",
          "geometryData": {
            "client": "lynx",
            "stateId": "landing-default",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "sidebar": {
                "tag": "X-VIEW",
                "className": "AppSidebar",
                "text": "StudioProjectsNew threadSearch⌘KKanbanPull requestsAutomationsProjectsP10 Fidelity WorkspacePerceptu",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "tag": "X-VIEW",
                "className": "AppSidebarProjectHeader",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 6,
                  "y": 287,
                  "width": 243,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "tag": "X-TEXT",
                "className": "SharedSidebarProjectSummaryName",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 38,
                  "y": 292,
                  "width": 131.203125,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "tag": "X-TEXT",
                "className": "CenteredEmptyLandingHeading",
                "text": "What should we work on?",
                "box": {
                  "x": 607.8125,
                  "y": 367,
                  "width": 320.359375,
                  "height": 35
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "35px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "tag": "X-VIEW",
                "className": "ComposerInputSurfaceLynx",
                "text": "Full accessGPT-5.5⌄Medium⌄↑",
                "box": {
                  "x": 400,
                  "y": 421,
                  "width": 736,
                  "height": 95
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(13, 13, 13, 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "tag": "X-TEXTAREA",
                "className": "ComposerTextarea",
                "text": "",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 0,
                  "height": 0
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "tag": "X-VIEW",
                "className": "LxMenuTrigger LandingComposerProjectTrigger ComposerProjectPickerTriggerLynx",
                "text": "Work in a project",
                "box": {
                  "x": 400,
                  "y": 520,
                  "width": 127.859375,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "X-TEXT",
                "className": "SharedChatHeaderIdentityTitle",
                "text": "New Chat",
                "box": {
                  "x": 298,
                  "y": 15.5,
                  "width": 55.0625,
                  "height": 15
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "styles": "browser/landing-default/lynx/styles.json",
          "stylesData": {
            "client": "lynx",
            "stateId": "landing-default",
            "roles": {
              "sidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "35px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(13, 13, 13, 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "console": "browser/landing-default/lynx/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "native": {
          "status": "diagnostic",
          "reason": "Exact-owned frame was captured from PID 70524 / localhost:8904, but DevTool disconnected before route and geometry artifacts could be revalidated. It cannot satisfy a required P10 cell.",
          "path": "native/default/raw.png",
          "comparisonPath": "native/default/comparison.png",
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        }
      }
    },
    {
      "id": "sidebar-default",
      "label": "Sidebar · Default project navigation",
      "semanticRoute": "new-chat",
      "theme": "light",
      "density": "comfortable",
      "interactionState": "default",
      "viewport": {
        "width": 1280,
        "height": 820,
        "devicePixelRatio": 1
      },
      "comparisonViewport": {
        "width": 1280,
        "height": 788
      },
      "residuals": [
        {
          "id": "sidebar-default-shell-inset",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "apps/lynx/src/app/App.css / SharedAppShellFrame host geometry",
          "summary": "Lynx-for-Web shell is inset by 8px on both axes.",
          "impact": "Every high-salience anchor reads as a shifted replica even when component geometry is exact.",
          "recommendation": "Remove or centralize the Browser-only host inset so product content uses the Web authority origin; preserve any Native titlebar correction separately.",
          "evidence": "browser/sidebar-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "sidebar-default-header-relative-offset",
          "category": "GEOMETRY",
          "severity": "P2",
          "status": "fixed",
          "owner": "ChatSurfaceHeaderFrame Lynx host adapter",
          "summary": "Lynx header title is +16px X and +9.5px Y versus Web.",
          "impact": "Header and body do not share the same visual rail, increasing the uncanny shell impression.",
          "recommendation": "Calibrate header frame padding after the outer shell inset is removed; target relative delta <=2px.",
          "evidence": "browser/sidebar-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "sidebar-default-sidebar-project-rhythm",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "apps/lynx/src/components/sidebar/sidebar.css",
          "summary": "Project section starts 17.75px lower; Lynx project header is 235px wide versus Web 244px.",
          "impact": "Sidebar density and grouping rhythm feel materially different in the highest-frequency navigation surface.",
          "recommendation": "Align section spacing and project-row horizontal insets to Web after removing the outer host inset.",
          "evidence": "browser/sidebar-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "sidebar-default-sidebar-project-linebox",
          "category": "TYPOGRAPHY",
          "severity": "P2",
          "status": "fixed",
          "owner": "SharedSidebarProjectSummaryName Lynx text metrics",
          "summary": "Project label uses the same 12px/400 face but a 15px visual line box versus Web 18px.",
          "impact": "Rows look vertically tighter and text sits off the Web baseline.",
          "recommendation": "Introduce a named sidebar-row text line-height/baseline correction in the Lynx Elements layer.",
          "evidence": "browser/sidebar-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "sidebar-default-project-run-capability",
          "category": "INTENTIONAL_PLATFORM_DELTA",
          "severity": "P2",
          "status": "intentional-delta",
          "owner": "Lynx sidebar project-run projection boundary",
          "summary": "Web can show a local-server/project-run dot; Lynx has no equivalent run projection.",
          "impact": "Only active project-run status differs; the previous misleading thread-count badge has been removed.",
          "recommendation": "Share the project-run projection before adding a Native indicator; do not infer running from thread count.",
          "reason": "Lynx snapshot exposes thread lifecycle status but not Web local-server/project-run state.",
          "evidence": "browser/sidebar-default/lynx/geometry.json"
        }
      ],
      "evidence": {
        "web": {
          "status": "retained",
          "reason": null,
          "path": "browser/sidebar-default/web/raw.png",
          "comparisonPath": "browser/sidebar-default/web/comparison.png",
          "geometry": "browser/sidebar-default/web/geometry.json",
          "geometryData": {
            "client": "web",
            "stateId": "sidebar-default",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "sidebar": {
                "tag": "DIV",
                "className": "relative z-0 flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm/5 app-sidebar-surface",
                "text": "Toggle SidebarToggle SidebarStudioProjectsNew thread⌘NSearch⌘KKanbanPull requestsAutomationsProjects",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "tag": "BUTTON",
                "className": "peer/menu-button overflow-hidden p-2 ring-ring/60 active:bg-[var(--sidebar-accent-active)] active:text-[var(--sidebar-accent-foreground)] disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pe-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[var(--sidebar-accent-active)] data-[active=true]:text-[var(--sidebar-accent-foreground)] data-[state=open]:hover:bg-[var(--sidebar-accent)] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0 flex w-full min-w-0 items-center text-left select-none min-h-[var(--app-density-row-height,1.75rem)] h-[var(--app-density-row-height,1.75rem)] gap-[var(--app-density-row-gap,0.5rem)] rounded-md px-2 py-[var(--app-density-row-padding-y,0.125rem)] text-[length:var(--app-font-size-ui,12px)] font-normal outline-hidden transition-colors focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring hover:bg-[var(--sidebar-accent)] group-hover/project-header:bg-[var(--sidebar-accent)] group-hover/project-header:text-[var(--sidebar-accent-foreground)] cursor-grab active:cursor-grabbing",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 6,
                  "y": 287.25,
                  "width": 244,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "tag": "SPAN",
                "className": "inline-block shrink-0 bg-current size-4",
                "text": "",
                "box": {
                  "x": 14,
                  "y": 293.25,
                  "width": 16,
                  "height": 16
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "tag": "H2",
                "className": "text-[26px] font-normal leading-[1.15] tracking-[-0.015em] text-foreground/95 sm:text-[30px]",
                "text": "What should we work on?",
                "box": {
                  "x": 607.8125,
                  "y": 367.25,
                  "width": 320.359375,
                  "height": 34.5
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "34.5px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "tag": "DIV",
                "className": "chat-composer-surface border border-[color:color-mix(in_srgb,var(--color-border-heavy)_95%,var(--foreground)_5%)] dark:border-border shadow-[0_4px_18px_-6px_color-mix(in_srgb,var(--foreground)_7%,transparent)] dark:shadow-[0_6px_24px_-10px_rgba(0,0,0,0.30)] transition-colors duration-200",
                "text": "Ask for follow-up changes or attach imagesFull accessGPT-5.5Medium",
                "box": {
                  "x": 400,
                  "y": 421.75,
                  "width": 736,
                  "height": 95
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864706)",
                  "borderColor": "color(srgb 0.0509804 0.0509804 0.0509804 / 0.105882)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, color(srgb 0.0509804 0.0509804 0.0509804 / 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "tag": "DIV",
                "className": "block max-h-[200px] w-full overflow-y-auto whitespace-pre-wrap break-words bg-transparent text-foreground focus:outline-none font-system-ui text-[length:var(--app-font-size-chat,12px)] leading-relaxed min-h-[var(--app-density-composer-editor-min-height,2lh)] [&_p]:m-0",
                "text": "",
                "box": {
                  "x": 413,
                  "y": 434.75,
                  "width": 708,
                  "height": 39
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "tag": "BUTTON",
                "className": "[&_svg,&_[data-slot=central-icon]]:-mx-0.5 relative inline-flex cursor-pointer items-center rounded-lg border outline-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_[data-slot=central-icon]:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 [&_[data-slot=central-icon]:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 sm:[&_[data-slot=central-icon]:not([class*='size-'])]:size-4 [&_svg,&_[data-slot=central-icon]]:pointer-events-none [&_svg,&_[data-slot=central-icon]]:shrink-0 gap-1.5 sm:h-7 border-transparent bg-transparent focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-[var(--color-background-elevated-secondary)] [:hover,[data-pressed]]:text-[var(--color-text-foreground)] data-pressed:bg-[var(--color-background-elevated-secondary)] min-w-0 justify-start overflow-hidden whitespace-nowrap px-1.5 [&_svg]:mx-0 text-[length:var(--app-font-size-ui-sm,11px)] text-[var(--color-text-foreground-secondary)] sm:text-[length:var(--app-font-size-ui-sm,11px)] font-normal hover:text-[var(--color-text-foreground)] data-pressed:text-[var(--color-text-foreground)] max-w-56 shrink sm:max-w-64 sm:px-1.5 h-7 py-1",
                "text": "Work in a project",
                "box": {
                  "x": 408,
                  "y": 520.75,
                  "width": 122.859375,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "11px",
                  "weight": "400",
                  "lineHeight": "16.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(0, 0, 0, 0)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "H2",
                "className": "max-w-[clamp(12rem,42vw,36rem)] truncate font-system-ui text-[length:var(--app-font-size-ui,12px)] font-normal text-foreground",
                "text": "New Chat",
                "box": {
                  "x": 298,
                  "y": 14,
                  "width": 55.0625,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "styles": "browser/sidebar-default/web/styles.json",
          "stylesData": {
            "client": "web",
            "stateId": "sidebar-default",
            "roles": {
              "sidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "34.5px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864706)",
                  "borderColor": "color(srgb 0.0509804 0.0509804 0.0509804 / 0.105882)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, color(srgb 0.0509804 0.0509804 0.0509804 / 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "11px",
                  "weight": "400",
                  "lineHeight": "16.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(0, 0, 0, 0)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "console": "browser/sidebar-default/web/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "lynx": {
          "status": "retained",
          "reason": null,
          "path": "browser/sidebar-default/lynx/raw.png",
          "comparisonPath": "browser/sidebar-default/lynx/comparison.png",
          "geometry": "browser/sidebar-default/lynx/geometry.json",
          "geometryData": {
            "client": "lynx",
            "stateId": "sidebar-default",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "sidebar": {
                "tag": "X-VIEW",
                "className": "AppSidebar",
                "text": "StudioProjectsNew threadSearch⌘KKanbanPull requestsAutomationsProjectsP10 Fidelity WorkspacePerceptu",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "tag": "X-VIEW",
                "className": "AppSidebarProjectHeader",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 6,
                  "y": 287,
                  "width": 243,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "tag": "X-TEXT",
                "className": "SharedSidebarProjectSummaryName",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 38,
                  "y": 292,
                  "width": 131.203125,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "tag": "X-TEXT",
                "className": "CenteredEmptyLandingHeading",
                "text": "What should we work on?",
                "box": {
                  "x": 607.8125,
                  "y": 367,
                  "width": 320.359375,
                  "height": 35
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "35px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "tag": "X-VIEW",
                "className": "ComposerInputSurfaceLynx",
                "text": "Full accessGPT-5.5⌄Medium⌄↑",
                "box": {
                  "x": 400,
                  "y": 421,
                  "width": 736,
                  "height": 95
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(13, 13, 13, 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "tag": "X-TEXTAREA",
                "className": "ComposerTextarea",
                "text": "",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 0,
                  "height": 0
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "tag": "X-VIEW",
                "className": "LxMenuTrigger LandingComposerProjectTrigger ComposerProjectPickerTriggerLynx",
                "text": "Work in a project",
                "box": {
                  "x": 400,
                  "y": 520,
                  "width": 127.859375,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "X-TEXT",
                "className": "SharedChatHeaderIdentityTitle",
                "text": "New Chat",
                "box": {
                  "x": 298,
                  "y": 15.5,
                  "width": 55.0625,
                  "height": 15
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "styles": "browser/sidebar-default/lynx/styles.json",
          "stylesData": {
            "client": "lynx",
            "stateId": "sidebar-default",
            "roles": {
              "sidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "35px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(13, 13, 13, 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "console": "browser/sidebar-default/lynx/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "native": {
          "status": "diagnostic",
          "reason": "Exact-owned frame was captured from PID 70524 / localhost:8904, but DevTool disconnected before route and geometry artifacts could be revalidated. It cannot satisfy a required P10 cell.",
          "path": "native/default/raw.png",
          "comparisonPath": "native/default/comparison.png",
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        }
      }
    },
    {
      "id": "composer-default",
      "label": "Composer · Default",
      "semanticRoute": "new-chat",
      "theme": "light",
      "density": "comfortable",
      "interactionState": "default",
      "viewport": {
        "width": 1280,
        "height": 820,
        "devicePixelRatio": 1
      },
      "comparisonViewport": {
        "width": 1280,
        "height": 788
      },
      "residuals": [
        {
          "id": "composer-default-shell-inset",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "apps/lynx/src/app/App.css / SharedAppShellFrame host geometry",
          "summary": "Lynx-for-Web shell is inset by 8px on both axes.",
          "impact": "Every high-salience anchor reads as a shifted replica even when component geometry is exact.",
          "recommendation": "Remove or centralize the Browser-only host inset so product content uses the Web authority origin; preserve any Native titlebar correction separately.",
          "evidence": "browser/composer-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "composer-default-header-relative-offset",
          "category": "GEOMETRY",
          "severity": "P2",
          "status": "fixed",
          "owner": "ChatSurfaceHeaderFrame Lynx host adapter",
          "summary": "Lynx header title is +16px X and +9.5px Y versus Web.",
          "impact": "Header and body do not share the same visual rail, increasing the uncanny shell impression.",
          "recommendation": "Calibrate header frame padding after the outer shell inset is removed; target relative delta <=2px.",
          "evidence": "browser/composer-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "composer-default-composer-origin-offset",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "ComposerColumnFrameSurface / landing shell origin",
          "summary": "Composer is exactly 736×95 with matching radius/material but shifted +8px X and +7.25px Y.",
          "impact": "A geometrically accurate control still reads as a different composition because its rail is displaced.",
          "recommendation": "Fix the parent rail/origin; do not change Composer width, radius, border, or shadow.",
          "evidence": "browser/composer-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        },
        {
          "id": "composer-default-project-trigger-optics",
          "category": "GEOMETRY",
          "severity": "P2",
          "status": "fixed",
          "owner": "ComposerProjectPickerTriggerCompositionElements.lynx",
          "summary": "Lynx project trigger is 5px wider and its text sits 9.5px right / 9px down versus Web after outer-origin accounting.",
          "impact": "The footer control balance differs even though copy and font size match.",
          "recommendation": "Calibrate icon/text gap and trigger content padding with a named optical correction.",
          "evidence": "browser/composer-default/lynx/geometry.json",
          "reason": "Current-build Browser paired geometry after shared host/sidebar calibration."
        }
      ],
      "evidence": {
        "web": {
          "status": "retained",
          "reason": null,
          "path": "browser/composer-default/web/raw.png",
          "comparisonPath": "browser/composer-default/web/comparison.png",
          "geometry": "browser/composer-default/web/geometry.json",
          "geometryData": {
            "client": "web",
            "stateId": "composer-default",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "sidebar": {
                "tag": "DIV",
                "className": "relative z-0 flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm/5 app-sidebar-surface",
                "text": "Toggle SidebarToggle SidebarStudioProjectsNew thread⌘NSearch⌘KKanbanPull requestsAutomationsProjects",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "tag": "BUTTON",
                "className": "peer/menu-button overflow-hidden p-2 ring-ring/60 active:bg-[var(--sidebar-accent-active)] active:text-[var(--sidebar-accent-foreground)] disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pe-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[var(--sidebar-accent-active)] data-[active=true]:text-[var(--sidebar-accent-foreground)] data-[state=open]:hover:bg-[var(--sidebar-accent)] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0 flex w-full min-w-0 items-center text-left select-none min-h-[var(--app-density-row-height,1.75rem)] h-[var(--app-density-row-height,1.75rem)] gap-[var(--app-density-row-gap,0.5rem)] rounded-md px-2 py-[var(--app-density-row-padding-y,0.125rem)] text-[length:var(--app-font-size-ui,12px)] font-normal outline-hidden transition-colors focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring hover:bg-[var(--sidebar-accent)] group-hover/project-header:bg-[var(--sidebar-accent)] group-hover/project-header:text-[var(--sidebar-accent-foreground)] cursor-grab active:cursor-grabbing",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 6,
                  "y": 287.25,
                  "width": 244,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "tag": "SPAN",
                "className": "inline-block shrink-0 bg-current size-4",
                "text": "",
                "box": {
                  "x": 14,
                  "y": 293.25,
                  "width": 16,
                  "height": 16
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "tag": "H2",
                "className": "text-[26px] font-normal leading-[1.15] tracking-[-0.015em] text-foreground/95 sm:text-[30px]",
                "text": "What should we work on?",
                "box": {
                  "x": 607.8125,
                  "y": 367.25,
                  "width": 320.359375,
                  "height": 34.5
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "34.5px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "tag": "DIV",
                "className": "chat-composer-surface border border-[color:color-mix(in_srgb,var(--color-border-heavy)_95%,var(--foreground)_5%)] dark:border-border shadow-[0_4px_18px_-6px_color-mix(in_srgb,var(--foreground)_7%,transparent)] dark:shadow-[0_6px_24px_-10px_rgba(0,0,0,0.30)] transition-colors duration-200",
                "text": "Ask for follow-up changes or attach imagesFull accessGPT-5.5Medium",
                "box": {
                  "x": 400,
                  "y": 421.75,
                  "width": 736,
                  "height": 95
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864706)",
                  "borderColor": "color(srgb 0.0509804 0.0509804 0.0509804 / 0.105882)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, color(srgb 0.0509804 0.0509804 0.0509804 / 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "tag": "DIV",
                "className": "block max-h-[200px] w-full overflow-y-auto whitespace-pre-wrap break-words bg-transparent text-foreground focus:outline-none font-system-ui text-[length:var(--app-font-size-chat,12px)] leading-relaxed min-h-[var(--app-density-composer-editor-min-height,2lh)] [&_p]:m-0",
                "text": "",
                "box": {
                  "x": 413,
                  "y": 434.75,
                  "width": 708,
                  "height": 39
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "tag": "BUTTON",
                "className": "[&_svg,&_[data-slot=central-icon]]:-mx-0.5 relative inline-flex cursor-pointer items-center rounded-lg border outline-none pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_[data-slot=central-icon]:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 [&_[data-slot=central-icon]:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 sm:[&_[data-slot=central-icon]:not([class*='size-'])]:size-4 [&_svg,&_[data-slot=central-icon]]:pointer-events-none [&_svg,&_[data-slot=central-icon]]:shrink-0 gap-1.5 sm:h-7 border-transparent bg-transparent focus-visible:ring-[color:var(--color-border-focus)]/60 focus-visible:ring-offset-0 [:hover,[data-pressed]]:bg-[var(--color-background-elevated-secondary)] [:hover,[data-pressed]]:text-[var(--color-text-foreground)] data-pressed:bg-[var(--color-background-elevated-secondary)] min-w-0 justify-start overflow-hidden whitespace-nowrap px-1.5 [&_svg]:mx-0 text-[length:var(--app-font-size-ui-sm,11px)] text-[var(--color-text-foreground-secondary)] sm:text-[length:var(--app-font-size-ui-sm,11px)] font-normal hover:text-[var(--color-text-foreground)] data-pressed:text-[var(--color-text-foreground)] max-w-56 shrink sm:max-w-64 sm:px-1.5 h-7 py-1",
                "text": "Work in a project",
                "box": {
                  "x": 408,
                  "y": 520.75,
                  "width": 122.859375,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "11px",
                  "weight": "400",
                  "lineHeight": "16.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(0, 0, 0, 0)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "H2",
                "className": "max-w-[clamp(12rem,42vw,36rem)] truncate font-system-ui text-[length:var(--app-font-size-ui,12px)] font-normal text-foreground",
                "text": "New Chat",
                "box": {
                  "x": 298,
                  "y": 14,
                  "width": 55.0625,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "styles": "browser/composer-default/web/styles.json",
          "stylesData": {
            "client": "web",
            "stateId": "composer-default",
            "roles": {
              "sidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "34.5px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.95)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864706)",
                  "borderColor": "color(srgb 0.0509804 0.0509804 0.0509804 / 0.105882)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, color(srgb 0.0509804 0.0509804 0.0509804 / 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "11px",
                  "weight": "400",
                  "lineHeight": "16.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(0, 0, 0, 0)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "console": "browser/composer-default/web/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "lynx": {
          "status": "retained",
          "reason": null,
          "path": "browser/composer-default/lynx/raw.png",
          "comparisonPath": "browser/composer-default/lynx/comparison.png",
          "geometry": "browser/composer-default/lynx/geometry.json",
          "geometryData": {
            "client": "lynx",
            "stateId": "composer-default",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "sidebar": {
                "tag": "X-VIEW",
                "className": "AppSidebar",
                "text": "StudioProjectsNew threadSearch⌘KKanbanPull requestsAutomationsProjectsP10 Fidelity WorkspacePerceptu",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "tag": "X-VIEW",
                "className": "AppSidebarProjectHeader",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 6,
                  "y": 287,
                  "width": 243,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "tag": "X-TEXT",
                "className": "SharedSidebarProjectSummaryName",
                "text": "P10 Fidelity Workspace",
                "box": {
                  "x": 38,
                  "y": 292,
                  "width": 131.203125,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "tag": "X-TEXT",
                "className": "CenteredEmptyLandingHeading",
                "text": "What should we work on?",
                "box": {
                  "x": 607.8125,
                  "y": 367,
                  "width": 320.359375,
                  "height": 35
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "35px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "tag": "X-VIEW",
                "className": "ComposerInputSurfaceLynx",
                "text": "Full accessGPT-5.5⌄Medium⌄↑",
                "box": {
                  "x": 400,
                  "y": 421,
                  "width": 736,
                  "height": 95
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(13, 13, 13, 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "tag": "X-TEXTAREA",
                "className": "ComposerTextarea",
                "text": "",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 0,
                  "height": 0
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "tag": "X-VIEW",
                "className": "LxMenuTrigger LandingComposerProjectTrigger ComposerProjectPickerTriggerLynx",
                "text": "Work in a project",
                "box": {
                  "x": 400,
                  "y": 520,
                  "width": 127.859375,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "X-TEXT",
                "className": "SharedChatHeaderIdentityTitle",
                "text": "New Chat",
                "box": {
                  "x": 298,
                  "y": 15.5,
                  "width": 55.0625,
                  "height": 15
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "styles": "browser/composer-default/lynx/styles.json",
          "stylesData": {
            "client": "lynx",
            "stateId": "composer-default",
            "roles": {
              "sidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "hero": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "30px",
                  "weight": "400",
                  "lineHeight": "35px",
                  "letterSpacing": "-0.45px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "composerSurface": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "oklab(0.999994 0.0000455678 0.0000200868 / 0.864)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "19.2px",
                  "shadow": "rgba(13, 13, 13, 0.07) 0px 4px 18px -6px",
                  "opacity": "1"
                }
              },
              "textbox": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "19.5px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "projectTrigger": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "8px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              }
            }
          },
          "console": "browser/composer-default/lynx/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "native": {
          "status": "diagnostic",
          "reason": "Exact-owned frame was captured from PID 70524 / localhost:8904, but DevTool disconnected before route and geometry artifacts could be revalidated. It cannot satisfy a required P10 cell.",
          "path": "native/default/raw.png",
          "comparisonPath": "native/default/comparison.png",
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        }
      }
    },
    {
      "id": "project-picker-open",
      "label": "Project Picker · Open",
      "semanticRoute": "new-chat",
      "theme": "light",
      "density": "comfortable",
      "interactionState": "project-picker-open",
      "viewport": {
        "width": 1280,
        "height": 820,
        "devicePixelRatio": 1
      },
      "comparisonViewport": {
        "width": 1280,
        "height": 788
      },
      "residuals": [],
      "evidence": {
        "web": {
          "status": "pending",
          "reason": "Current-build P10 Web capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "lynx": {
          "status": "pending",
          "reason": "Current-build P10 Lynx-for-Web capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "native": {
          "status": "pending",
          "reason": "Current-build exact-owned Native capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        }
      }
    },
    {
      "id": "skill-menu-filtered",
      "label": "Skill menu · Filtered review-agent",
      "semanticRoute": "new-chat",
      "theme": "light",
      "density": "comfortable",
      "interactionState": "skill-filtered-review-agent",
      "viewport": {
        "width": 1280,
        "height": 820,
        "devicePixelRatio": 1
      },
      "comparisonViewport": {
        "width": 1280,
        "height": 788
      },
      "residuals": [],
      "evidence": {
        "web": {
          "status": "pending",
          "reason": "Current-build P10 Web capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "lynx": {
          "status": "pending",
          "reason": "Current-build P10 Lynx-for-Web capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "native": {
          "status": "pending",
          "reason": "Current-build exact-owned Native capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        }
      }
    },
    {
      "id": "settings-general",
      "label": "Settings · General",
      "semanticRoute": "settings-general",
      "theme": "light",
      "density": "comfortable",
      "interactionState": "default",
      "viewport": {
        "width": 1280,
        "height": 820,
        "devicePixelRatio": 1
      },
      "comparisonViewport": {
        "width": 1280,
        "height": 788
      },
      "residuals": [
        {
          "id": "settings-general-row-type-scale",
          "category": "TYPOGRAPHY",
          "severity": "P1",
          "status": "fixed",
          "owner": "apps/lynx/src/adapters/settings-general-composition-elements.css",
          "summary": "Lynx General row titles used 13px while Web used the canonical 12px settings-row role.",
          "impact": "The denser Lynx labels made every settings card read heavier than the Web authority.",
          "recommendation": "Consume the shared settings row title and description roles in every General composition adapter.",
          "evidence": "browser/settings-general/lynx/geometry.json",
          "reason": "Post-fix paired geometry resolves both row title and description to the same size, weight, and line box."
        },
        {
          "id": "settings-general-header-tracking",
          "category": "TYPOGRAPHY",
          "severity": "P2",
          "status": "fixed",
          "owner": "shared settings header typography role",
          "summary": "Lynx omitted the Web header title's -0.5px tracking.",
          "impact": "The page title looked wider and less deliberate despite matching font size and weight.",
          "recommendation": "Keep title letter spacing in the semantic role rather than a Web-only utility.",
          "evidence": "browser/settings-general/lynx/styles.json",
          "reason": "Both clients now resolve the header title to 20px/500/28px with -0.5px letter spacing."
        },
        {
          "id": "settings-general-section-label-density",
          "category": "TYPOGRAPHY",
          "severity": "P2",
          "status": "fixed",
          "owner": "shared settings section-label typography role",
          "summary": "Lynx section labels used weight 500 and full muted color while Web used weight 400 at 58% opacity.",
          "impact": "Section labels competed with row titles and flattened the intended hierarchy.",
          "recommendation": "Centralize section-label size, line height, weight, and opacity.",
          "evidence": "browser/settings-general/lynx/styles.json",
          "reason": "Post-fix section labels resolve to 12px/400/18px with 0.58 opacity."
        },
        {
          "id": "settings-general-sidebar-width",
          "category": "GEOMETRY",
          "severity": "P1",
          "status": "fixed",
          "owner": "apps/lynx/src/app/App.css SettingsSidebar",
          "summary": "The Lynx Settings sidebar was 250px instead of the Web shell's 256px.",
          "impact": "The centered 624px content rail shifted 3px left, making every settings anchor subtly wrong.",
          "recommendation": "Use the canonical 256px shell width instead of an independent Settings width.",
          "evidence": "browser/settings-general/lynx/geometry.json",
          "reason": "Sidebar, header, section, card, row, and title anchors now match Web exactly."
        },
        {
          "id": "settings-general-select-control-optics",
          "category": "MATERIAL",
          "severity": "P1",
          "status": "fixed",
          "owner": "SharedSettingsGeneralSelectTrigger / shared select primitive",
          "summary": "The Lynx select trigger is 144px wide with an 8px transparent shell while Web is 176px wide with a 10px opaque white shell.",
          "impact": "The highest-frequency control in General settings still has a visibly different visual weight and right-edge rhythm.",
          "recommendation": "Keep Settings select geometry, label line box, chevron bounds, and opaque surface in the shared primitive.",
          "evidence": "browser/settings-general/lynx/geometry.json",
          "reason": "Post-fix control, label, and chevron positions are exact at 176x32 with a 10px opaque shell and 12px/18px label."
        },
        {
          "id": "settings-general-card-terminal-divider",
          "category": "ENGINE_CORRECTION",
          "severity": "P2",
          "status": "fixed",
          "owner": "SharedSettingsGeneralCard row separator contract",
          "summary": "Lynx draws a bottom divider on the last row, making the two-row card one pixel taller than Web.",
          "impact": "Repeated cards accumulate a small vertical rhythm drift.",
          "recommendation": "Keep terminal-row separator ownership explicit in physical-shared composition.",
          "evidence": "browser/settings-general/lynx/geometry.json",
          "reason": "The terminal modifier removes its divider and uses the Web-authority 60px row height; card and both rows now match exactly."
        }
      ],
      "evidence": {
        "web": {
          "status": "retained",
          "reason": null,
          "path": "browser/settings-general/web/raw.png",
          "comparisonPath": "browser/settings-general/web/comparison.png",
          "geometry": "browser/settings-general/web/geometry.json",
          "geometryData": {
            "client": "web",
            "stateId": "settings-general",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "settingsSidebar": {
                "tag": "DIV",
                "className": "relative z-0 flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm/5 app-sidebar-surface",
                "text": "Toggle SidebarToggle SidebarBack to appAppGeneralProfileAppearanceNotificationsBehaviorAppSnapKeyboard ShortcutsWorktreesArchivedSynaraModelsProvidersSkillsUsageIntegrationsAdvance",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "H1",
                "className": "text-[length:var(--type-settings-header-title-size)] leading-[var(--type-settings-header-title-line-height)] tracking-[var(--type-settings-header-title-letter-spacing)] font-medium text-foreground",
                "text": "General",
                "box": {
                  "x": 456,
                  "y": 32,
                  "width": 363.890625,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "20px",
                  "weight": "500",
                  "lineHeight": "28px",
                  "letterSpacing": "-0.5px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerDescription": {
                "tag": "P",
                "className": "mt-1.5 text-[length:var(--type-settings-header-description-size)] leading-[var(--type-settings-header-description-line-height)] text-muted-foreground",
                "text": "Default provider, thread mode, and sidebar organization.",
                "box": {
                  "x": 456,
                  "y": 66,
                  "width": 363.890625,
                  "height": 20
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "14px",
                  "weight": "400",
                  "lineHeight": "20px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "sectionTitle": {
                "tag": "H2",
                "className": "px-2 py-1 text-[length:var(--app-font-size-ui,12px)] font-normal text-muted-foreground/58",
                "text": "Core defaults",
                "box": {
                  "x": 456,
                  "y": 118,
                  "width": 624,
                  "height": 26
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.345726)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "card": {
                "tag": "DIV",
                "className": "overflow-hidden bg-transparent border border-[color:var(--color-border)] rounded-lg divide-y divide-[color:var(--color-border)]",
                "text": "Default providerChoose the provider used for new chats.CodexNew threadsPick the default workspace mode for newly created draft threads.Local",
                "box": {
                  "x": 456,
                  "y": 150,
                  "width": 624,
                  "height": 123
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "row": {
                "tag": "DIV",
                "className": "px-3 py-[var(--app-density-settings-row-padding-y,0.625rem)] scroll-mt-24",
                "text": "Default providerChoose the provider used for new chats.Codex",
                "box": {
                  "x": 457,
                  "y": 151,
                  "width": 622,
                  "height": 61
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px 0px 1px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "terminalRow": {
                "tag": "DIV",
                "className": "px-3 py-[var(--app-density-settings-row-padding-y,0.625rem)] scroll-mt-24",
                "text": "New threadsPick the default workspace mode for newly created draft threads.Local",
                "box": {
                  "x": 457,
                  "y": 212,
                  "width": 622,
                  "height": 60
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowTitle": {
                "tag": "H3",
                "className": "text-[length:var(--type-settings-row-title-size)] leading-[var(--type-settings-row-title-line-height)] font-medium text-foreground",
                "text": "Default provider",
                "box": {
                  "x": 469,
                  "y": 162,
                  "width": 93.25,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "500",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowDescription": {
                "tag": "P",
                "className": "text-[length:var(--type-settings-row-description-size)] leading-[var(--type-settings-row-description-line-height)] text-muted-foreground",
                "text": "Choose the provider used for new chats.",
                "box": {
                  "x": 469,
                  "y": 183,
                  "width": 412,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "control": {
                "tag": "BUTTON",
                "className": "relative inline-flex cursor-pointer select-none items-center justify-between gap-2 border rounded-md text-left text-[length:var(--app-font-size-ui,12px)] outline-none transition-[color,background-color] data-disabled:pointer-events-none data-disabled:opacity-64 sm:text-[length:var(--app-font-size-ui,12px)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 min-w-36 border-[color:var(--color-border)] bg-[var(--color-background-control-opaque)] text-[var(--color-text-foreground)] ring-[color:var(--color-border-focus)]/16 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 focus-visible:border-[color:var(--color-border-focus)] focus-visible:ring-2 aria-invalid:border-destructive/30 focus-visible:aria-invalid:border-destructive/50 focus-visible:aria-invalid:ring-destructive/12 dark:aria-invalid:ring-destructive/20 [&_svg:not([class*='opacity-'])]:opacity-80 min-h-9 px-[calc(--spacing(3)-1px)] sm:min-h-8 !rounded-lg w-full sm:w-44",
                "text": "Codex",
                "box": {
                  "x": 891,
                  "y": 165,
                  "width": 176,
                  "height": 32
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlLabel": {
                "tag": "SPAN",
                "className": "flex-1 truncate data-placeholder:text-muted-foreground",
                "text": "Codex",
                "box": {
                  "x": 903,
                  "y": 172,
                  "width": 132,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlIcon": {
                "tag": "svg",
                "className": "[object SVGAnimatedString]",
                "text": "",
                "box": {
                  "x": 1043,
                  "y": 175,
                  "width": 12,
                  "height": 12
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "0.5"
                }
              }
            }
          },
          "styles": "browser/settings-general/web/styles.json",
          "stylesData": {
            "client": "web",
            "stateId": "settings-general",
            "roles": {
              "settingsSidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "rgba(0, 0, 0, 0.03) 0px 1px 0px 0px inset",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "20px",
                  "weight": "500",
                  "lineHeight": "28px",
                  "letterSpacing": "-0.5px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerDescription": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "14px",
                  "weight": "400",
                  "lineHeight": "20px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "sectionTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "oklab(0.159065 0.00000723451 0.00000317395 / 0.345726)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "card": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "row": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px 0px 1px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "terminalRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "24px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "500",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowDescription": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "control": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlIcon": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "0.5"
                }
              }
            }
          },
          "console": "browser/settings-general/web/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "lynx": {
          "status": "retained",
          "reason": null,
          "path": "browser/settings-general/lynx/raw.png",
          "comparisonPath": "browser/settings-general/lynx/comparison.png",
          "geometry": "browser/settings-general/lynx/geometry.json",
          "geometryData": {
            "client": "lynx",
            "stateId": "settings-general",
            "viewport": {
              "width": 1280,
              "height": 820,
              "dpr": 1,
              "visualWidth": 1280,
              "visualHeight": 820
            },
            "roles": {
              "settingsSidebar": {
                "tag": "X-VIEW",
                "className": "SettingsSidebar",
                "text": "Back to appSearch unavailable in this runtimeAppGeneralProfileAppearanceNotificationsBehaviorAppSnapKeyboard ShortcutsWorktreesArchivedSynaraModelsProvidersSkillsUsageIntegrationsA",
                "box": {
                  "x": 0,
                  "y": 0,
                  "width": 256,
                  "height": 820
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "tag": "X-TEXT",
                "className": "SharedSettingsPanelHeaderTitle",
                "text": "General",
                "box": {
                  "x": 456,
                  "y": 32,
                  "width": 363.890625,
                  "height": 28
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "20px",
                  "weight": "500",
                  "lineHeight": "28px",
                  "letterSpacing": "-0.5px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerDescription": {
                "tag": "X-TEXT",
                "className": "SharedSettingsPanelHeaderDescription",
                "text": "Default provider, thread mode, and sidebar organization.",
                "box": {
                  "x": 456,
                  "y": 66,
                  "width": 363.890625,
                  "height": 20
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "14px",
                  "weight": "400",
                  "lineHeight": "20px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.596)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "sectionTitle": {
                "tag": "X-TEXT",
                "className": "SharedSettingsGeneralSectionTitle",
                "text": "Core defaults",
                "box": {
                  "x": 456,
                  "y": 118,
                  "width": 624,
                  "height": 26
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.596)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "0.58"
                }
              },
              "card": {
                "tag": "X-VIEW",
                "className": "SharedSettingsGeneralCard",
                "text": "Default providerChoose the provider used for new chats.CodexNew threadsPick the default workspace mode for newly created draft threads.Local",
                "box": {
                  "x": 456,
                  "y": 150,
                  "width": 624,
                  "height": 123
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "row": {
                "tag": "X-VIEW",
                "className": "SharedSettingsGeneralRow",
                "text": "Default providerChoose the provider used for new chats.Codex",
                "box": {
                  "x": 457,
                  "y": 151,
                  "width": 622,
                  "height": 61
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13) rgb(13, 13, 13) rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px 0px 1px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "terminalRow": {
                "tag": "X-VIEW",
                "className": "SharedSettingsGeneralRow SharedSettingsGeneralRow--terminal",
                "text": "New threadsPick the default workspace mode for newly created draft threads.Local",
                "box": {
                  "x": 457,
                  "y": 212,
                  "width": 622,
                  "height": 60
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13) rgb(13, 13, 13) rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowTitle": {
                "tag": "X-TEXT",
                "className": "SharedSettingsGeneralRowTitle",
                "text": "Default provider",
                "box": {
                  "x": 469,
                  "y": 162,
                  "width": 93.25,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "500",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowDescription": {
                "tag": "X-TEXT",
                "className": "SharedSettingsGeneralRowDescription",
                "text": "Choose the provider used for new chats.",
                "box": {
                  "x": 469,
                  "y": 182,
                  "width": 406,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.596)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "control": {
                "tag": "X-VIEW",
                "className": "LxButton LxButton--outline LxButton--default SharedSettingsGeneralSelectTrigger SharedSettingsGeneralSelectTrigger--general",
                "text": "Codex",
                "box": {
                  "x": 891,
                  "y": 165,
                  "width": 176,
                  "height": 32
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlLabel": {
                "tag": "X-TEXT",
                "className": "SharedSettingsGeneralSelectLabel",
                "text": "Codex",
                "box": {
                  "x": 903,
                  "y": 172,
                  "width": 35.96875,
                  "height": 18
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlIcon": {
                "tag": "X-SVG",
                "className": "SharedSettingsGeneralSelectChevron",
                "text": "",
                "box": {
                  "x": 1043,
                  "y": 175,
                  "width": 12,
                  "height": 12
                },
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "0.5"
                }
              }
            }
          },
          "styles": "browser/settings-general/lynx/styles.json",
          "stylesData": {
            "client": "lynx",
            "stateId": "settings-general",
            "roles": {
              "settingsSidebar": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgb(13, 13, 13) rgba(13, 13, 13, 0.07) rgb(13, 13, 13) rgb(13, 13, 13)",
                  "borderWidth": "0px 1px 0px 0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "20px",
                  "weight": "500",
                  "lineHeight": "28px",
                  "letterSpacing": "-0.5px"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "headerDescription": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "14px",
                  "weight": "400",
                  "lineHeight": "20px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.596)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "sectionTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.596)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "0.58"
                }
              },
              "card": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "row": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13) rgb(13, 13, 13) rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px 0px 1px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "terminalRow": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13) rgb(13, 13, 13) rgba(13, 13, 13, 0.07)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowTitle": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "500",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "rowDescription": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgba(13, 13, 13, 0.596)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgba(13, 13, 13, 0.596)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "control": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgb(255, 255, 255)",
                  "borderColor": "rgba(13, 13, 13, 0.07)",
                  "borderWidth": "1px",
                  "radius": "10px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlLabel": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "12px",
                  "weight": "400",
                  "lineHeight": "18px",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "1"
                }
              },
              "controlIcon": {
                "font": {
                  "family": "-apple-system, \"system-ui\", \"Segoe UI\", system-ui, sans-serif",
                  "size": "16px",
                  "weight": "400",
                  "lineHeight": "normal",
                  "letterSpacing": "normal"
                },
                "paint": {
                  "color": "rgb(13, 13, 13)",
                  "background": "rgba(0, 0, 0, 0)",
                  "borderColor": "rgb(13, 13, 13)",
                  "borderWidth": "0px",
                  "radius": "0px",
                  "shadow": "none",
                  "opacity": "0.5"
                }
              }
            }
          },
          "console": "browser/settings-general/lynx/console.txt",
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        },
        "native": {
          "status": "pending",
          "reason": "Current-build exact-owned Native capture has not been retained.",
          "path": null,
          "comparisonPath": null,
          "geometry": null,
          "geometryData": null,
          "styles": null,
          "stylesData": null,
          "console": null,
          "alignment": {
            "x": 0,
            "y": 0,
            "scale": 1
          }
        }
      }
    }
  ]
};
