"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HotelScene } from "@/three/HotelScene";
import { journeyBeats, getActiveBeat } from "@/data/journey";
import { useLenis } from "@/hooks/useLenis";
import { Nav } from "./Nav";
import { ProgressHUD } from "./ProgressHUD";
import { SectionOverlay } from "./SectionOverlay";

gsap.registerPlugin(ScrollTrigger);

const TRACK_VH = 1400;

export function Experience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HotelScene | null>(null);
  const scrollingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [progress, setProgress] = useState(0);
  const [navVisible, setNavVisible] = useState(true);

  useLenis();

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new HotelScene(canvasRef.current);
    sceneRef.current = scene;
    return () => scene.dispose();
  }, []);

  useEffect(() => {
    if (!trackRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: trackRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        sceneRef.current?.setProgress(self.progress);
        setProgress(self.progress);

        setNavVisible(false);
        if (scrollingTimeout.current) clearTimeout(scrollingTimeout.current);
        scrollingTimeout.current = setTimeout(() => setNavVisible(true), 650);
      },
    });

    return () => trigger.kill();
  }, []);

  const activeBeat = getActiveBeat(progress);

  return (
    <>
      <canvas ref={canvasRef} className="scene-canvas" />
      <Nav visible={navVisible} />
      <ProgressHUD
        visible={navVisible}
        progress={progress}
        beat={activeBeat}
        total={journeyBeats.length}
      />
      <div className="overlay-stage">
        {journeyBeats.map((beat) => (
          <div className="overlay-slot" key={beat.id} aria-hidden={beat.id !== activeBeat.id}>
            {beat.id === activeBeat.id && (
              <SectionOverlay progress={progress} beat={beat} />
            )}
          </div>
        ))}
      </div>
      <div ref={trackRef} className="scroll-track" style={{ height: `${TRACK_VH}vh` }} />
    </>
  );
}
