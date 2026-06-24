import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortionSelector from '@/components/PortionSelector';

describe('PortionSelector', () => {
  it('render_ShouldShowAllPortionButtons', () => {
    render(<PortionSelector value={1} onChange={vi.fn()} />);
    expect(screen.getByText('0.5x')).toBeDefined();
    expect(screen.getByText('0.75x')).toBeDefined();
    expect(screen.getByText('1x')).toBeDefined();
    expect(screen.getByText('1.5x')).toBeDefined();
    expect(screen.getByText('2x')).toBeDefined();
  });

  it('render_ShouldHighlightSelectedPortion', () => {
    render(<PortionSelector value={1.5} onChange={vi.fn()} />);
    const btn = screen.getByText('1.5x');
    expect(btn.className).toContain('bg-green-600');
  });

  it('onChange_ShouldBeCalledWithCorrectValue_WhenButtonClicked', () => {
    const onChange = vi.fn();
    render(<PortionSelector value={1} onChange={onChange} />);
    fireEvent.click(screen.getByText('2x'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('onChange_ShouldBeCalledWithHalfPortion_WhenHalfButtonClicked', () => {
    const onChange = vi.fn();
    render(<PortionSelector value={1} onChange={onChange} />);
    fireEvent.click(screen.getByText('0.5x'));
    expect(onChange).toHaveBeenCalledWith(0.5);
  });
});
