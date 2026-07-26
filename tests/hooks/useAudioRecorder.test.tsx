import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

describe('useAudioRecorder', () => {
  let mockStream: MediaStream;
  let startHandler: (() => void) | null = null;
  let stopHandler: (() => void) | null = null;
  let currentState = 'inactive';

  class MockMediaRecorder {
    static isTypeSupported = vi.fn().mockReturnValue(true);

    state: 'inactive' | 'recording' | 'paused' = 'inactive';
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstart: (() => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: (() => void) | null = null;

    start = vi.fn().mockImplementation(() => {
      this.state = 'recording';
      (this as unknown as { onstart: () => void }).onstart?.();
    });

    stop = vi.fn().mockImplementation(() => {
      this.state = 'inactive';
      const instance = this as unknown as { ondataavailable: (event: { data: Blob }) => void; onstop: () => void };
      instance.ondataavailable?.({ data: new Blob(['audio-data'], { type: 'audio/webm' }) });
      instance.onstop?.();
    });

    pause = vi.fn().mockImplementation(() => {
      this.state = 'paused';
    });

    resume = vi.fn().mockImplementation(() => {
      this.state = 'recording';
    });

    constructor() {
      Object.defineProperty(this, 'state', {
        get: () => currentState,
        set: (value: string) => {
          currentState = value;
        },
      });
    }
  }

  beforeEach(() => {
    currentState = 'inactive';
    startHandler = null;
    stopHandler = null;

    mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    } as unknown as MediaStream;

    vi.stubGlobal('MediaRecorder', MockMediaRecorder as unknown as typeof MediaRecorder);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.state).toBe('idle');
    expect(result.current.isSupported).toBe(true);
  });

  it('transitions to recording on start', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('recording');
  });

  it('stops recording and releases resources', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.state).toBe('stopped');
    expect(mockStream.getTracks).toHaveBeenCalled();
  });

  it('pauses and resumes recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.pauseRecording();
    });

    expect(result.current.state).toBe('paused');

    act(() => {
      result.current.resumeRecording();
    });

    expect(result.current.state).toBe('recording');
  });

  it('replaces an existing recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.recording).not.toBeNull();

    act(() => {
      result.current.replaceRecording();
    });

    expect(result.current.recording).toBeNull();
    expect(result.current.state).toBe('idle');
  });

  it('deletes an existing recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.recording).not.toBeNull();

    act(() => {
      result.current.deleteRecording();
    });

    expect(result.current.recording).toBeNull();
    expect(result.current.state).toBe('idle');
  });

  it('handles permission denial', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')),
      },
    });

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('permission_denied');
    expect(result.current.permissionDenied).toBe(true);
  });

  it('reports unsupported when MediaRecorder is missing', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.isSupported).toBe(false);
  });

  it('reports isReady after mount', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.isReady).toBe(true);
    expect(result.current.isSupported).toBe(true);
  });

  it('cleans up resources on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      unmount();
    });

    expect(mockStream.getTracks).toHaveBeenCalled();
  });

  it('does not start duplicate recording sessions', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.state).toBe('recording');

    await act(async () => {
      await result.current.startRecording();
    });

    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });
});
