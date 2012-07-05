;
; Special locations
; (they work with LDA/STA abs only!)
;
set_palette = $FF00 ; W: sets current index
write_color = $FF01 ; W++: R, G or B
set_row     = $FF02 ; W: pixel row
set_col     = $FF03 ; W: pixel col
write_pixel = $FF04 ; W++: writes a pixel

random      = $FF80 ; R: a random byte
clock0      = $FF81 ; R: updates clock and returns low byte
clock1      = $FF82 ; R: returns second byte of clock
clock2      = $FF83 ; R: returns third byte of clock
clock3      = $FF84 ; R: returns fourth byte of clock

;
; Execution begins at "start" and stops when
; program counter becomes $0000
;
    .org $0200

... put your code here ...
