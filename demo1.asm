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

;; Box drawing parameters
x0    = $00
y0    = $01
x1    = $02
y1    = $03
color = $04

;; Animated square position and speed
sqx   = $05
sqy   = $06
sqdx  = $07
sqdy  = $08

;; Line drawing
dx    = $09
dy    = $0A
ix    = $0B
iy    = $0C
cx    = $0D
cy    = $0E
m     = $0F

;; Draws a line from x0, y0 to x1, y1
drawline:
    ; dx/ix computation
    ldx #$01
    lda x1
    sec
    sbc x0
    bcs dlxpos
    eor #$FF
    sbc #$FE
    ldx #$FF
dlxpos:
    sta dx
    stx ix

    ; dy/iy computation
    ldx #$01
    lda y1
    sec
    sbc y0
    bcs dlypos
    eor #$FF
    sbc #$FE
    ldx #$FF
dlypos:
    sta dy
    stx iy

    ; m/cx/cy computation
    lda dx
    cmp dy
    bcs dlxm
    lda dy
dlxm:
    sta m
    tay
    bne dlsome
    rts
dlsome:
    lsr a
    sta cx
    sta cy

    ; main loop
dlloop:
    lda x0
    sta set_col
    lda y0
    sta set_row
    lda color
    sta write_pixel

    ; x-inc
    lda cx
    clc
    adc dx
    sta cx
    bcs dlxi
    cmp m
    bcc dlnoxi
dlxi:
    lda x0
    clc
    adc ix
    sta x0
    lda cx
    sec
    sbc m
    sta cx
dlnoxi:

    ; y-inc
    lda cy
    clc
    adc dy
    sta cy
    bcs dlyi
    cmp m
    bcc dlnoyi
dlyi:
    lda y0
    clc
    adc iy
    sta y0
    lda cy
    sec
    sbc m
    sta cy
dlnoyi:

    dey
    bne dlloop
    rts


;; Fills a box with a solid color
fillbox:
    lda y0
    sta set_row
    lda x0
    sta set_col
    lda x1
    sec
    sbc x0
    tax
    lda color
fbxloop:
    sta write_pixel
    dex
    bne fbxloop
    inc y0
    lda y0
    cmp y1
    bne fillbox
    rts

;; Sets square coordinates
set_square:
    lda sqx
    sta x0
    clc
    adc #$20
    sta x1
    lda sqy
    sta y0
    clc
    adc #$20
    sta y1
    rts

;; Main program
start:
    ; clear screen to random
    lda #$00
    tax
    tay
cloop:
    lda random
    sta write_pixel
    dex
    bne cloop
    dey
    bne cloop

    ; draw 2048 random lines
    ldy #$08
    ldx #$00
cloop2:
    txa
    pha
    tya
    pha
    lda random
    sta x1
    lda random
    sta y1
    tya
    sta color
    jsr drawline
    pla
    tay
    pla
    tax
    dex
    bne cloop2
    dey
    bne cloop2

    ; Set a green-red bouncing palette
    lda #$00
    sta set_palette
    ldx #$00
ploop1:
    txa
    sta write_color
    eor #$FF
    sta write_color
    lda #$00
    sta write_color
    inx
    inx
    bne ploop1
ploop2:
    txa
    eor #$FF
    sta write_color
    eor #$FF
    sta write_color
    lda #$00
    sta write_color
    inx
    inx
    bne ploop2

    ; Set starting position and speed
    lda #$01
    sta sqx
    sta sqy
    sta sqdx
    sta sqdy
mainloop:
    ; Increment square position
    lda sqx
    clc
    adc sqdx
    cmp #$DF
    bcc xok
    lda sqdx
    eor #$FF
    sta sqdx
    inc sqdx
    lda sqx
xok:
    sta sqx
    lda sqy
    clc
    adc sqdy
    cmp #$DD
    bcc yok
    lda sqdy
    eor #$FF
    sta sqdy
    inc sqdy
    lda sqy
yok:
    sta sqy

    ; Draw square
    jsr set_square
    inc color
    jsr fillbox

    jmp mainloop
