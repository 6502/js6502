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

mouse_b     = $FF85 ; R: mouse buttons (bits 0/1/2) or 255 if outside
mouse_x     = $FF86 ; R: mouse x position (0 if outside)
mouse_y     = $FF87 ; R: mouse y position (0 if outside)

;
; Execution begins at "start" and stops when
; program counter becomes $0000
;
    .org $0200

start:
    ;
    ; "Regular" non-self-modifying code
    ;
    ldx #$00
    ldy #$10
    lda #$00
    sta set_row
    sta set_col
loop1:
    sta write_pixel
    clc
    adc #$01
    bne loop1
    dex
    bne loop1
    clc
    adc #$01
    dey
    bne loop1
    jmp $0300

    .org $0300
    ;
    ; Self-modifying code
    ;
    ldx #$00
    ldy #$10
loop2:
    lda #$00 ; <----- $00 will be incremented!
    sta write_pixel
    inc $0305
    bne loop2
    dex
    bne loop2
    inc $0305
    dey
    bne loop2
    jmp $0000
